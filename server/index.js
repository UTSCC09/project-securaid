const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "@#HJDNJ@#$32445SFjN!@#@$",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("securaid");
    const usersCollection = database.collection("users");
    const filesCollection = database.collection("files");
    const projectCollection = database.collection("projects");

    // Route to register a new user
    app.post("/api/users", async (req, res) => {
      try {
        const { username, password } = req.body;

        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
          return res.status(409).json({
            message:
              "Username already exists. Please choose a different username.",
          });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = {
          username,
          password: hashedPassword,
        };

        const insertResult = await usersCollection.insertOne(user);
        res.json({ message: "User inserted", userId: insertResult.insertedId });
      } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).json({ message: "Error inserting user" });
      }
    });

    // Route for user login
    app.post("/api/users/login", async (req, res) => {
      try {
        const { username, password } = req.body;

        const user = await usersCollection.findOne({ username });
        if (!user) {
          return res
            .status(404)
            .json({ message: "No user found with that username" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Incorrect password" });
        }

        req.session.userId = user._id;

        res.json({ message: "Login successful", userId: user._id });
      } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Error during login" });
      }
    });

    app.post("/api/projects", async (req, res) => {
      try {
        // Log the incoming request body for debugging
        console.log("Incoming request body:", req.body);

        const { folderName, uploadedLinks, userId, ownership } = req.body;

        // Input validation
        if (!folderName || !uploadedLinks || !Array.isArray(uploadedLinks) || uploadedLinks.length === 0 || !userId) {
          console.log("Invalid input: Missing folderName, uploadedLinks, or userId.");
          return res.status(400).json({
            error: "Invalid input. Folder name, user ID, and file links are required.",
          });
        }

        // Log the validated inputs
        console.log("Validated folderName:", folderName);
        console.log("Validated uploadedLinks:", uploadedLinks);
        console.log("Validated userId:", userId);

        // Create the project object
        const project = {
          folderName,
          userId,
          ownership,
          createdAt: new Date(),
        };

        // Insert the project into the projects collection
        const insertResult = await projectCollection.insertOne(project);
        const projectId = insertResult.insertedId;

        console.log("Project created with ID:", projectId);

        // Prepare file documents for insertion
        const fileDocuments = uploadedLinks.map((file) => ({
          projectId,
          userId,
          filename: file.filename,
          url: file.url,
          ownership,
          createdAt: new Date(),
        }));

        console.log("File documents prepared for insertion:", fileDocuments);

        // Insert files into the files collection
        const filesInsertResult = await filesCollection.insertMany(fileDocuments);

        console.log("Files inserted:", filesInsertResult.insertedCount);

        // Respond with success
        res.status(201).json({
          message: "Project and files created successfully",
          projectId,
        });
      } catch (error) {
        // Log the error details
        console.error("Error creating project and saving file links:", error);
        res.status(500).json({ error: "An error occurred while creating the project." });
      }
    });
    app.get("/api/projects", async (req, res) => {
      try {
        const { userId } = req.query;

        if (!userId) {
          return res.status(400).json({ error: "User ID is required." });
        }

        // Fetch projects by userId
        const projects = await projectCollection
          .find({ userId: userId })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json({ projects });
      } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ error: "An error occurred while fetching projects." });
      }
    });


    app.get("/api/protected", async (req, res) => {
      if (!req.session.userId) {
        return res
          .status(401)
          .json({ message: "Unauthorized. Please log in." });
      }

      try {
        const user = await usersCollection.findOne({
          _id: new ObjectId(req.session.userId),
        });
        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }

        res.json({ username: user.username });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error." });
      }
    });
    app.delete("/api/files/:fileId", async (req, res) => {
      try {
        const { fileId } = req.params;
        console.log("------> File ID:", fileId);

        if (!fileId) {
          return res.status(400).json({ error: "File ID is required." });
        }

        // Convert fileId to ObjectId
        const fileObject = new ObjectId(fileId);

        // Find and delete the file
        const file = await filesCollection.findOne({ _id: fileObject });
        if (!file) {
          console.log("----> File not found");
          return res.status(404).json({ error: "File not found." });
        }

        await filesCollection.deleteOne({ _id: fileObject });

        // Check if the project has remaining files
        const remainingFiles = await filesCollection
          .find({ projectId: file.projectId })
          .toArray();

        console.log("Remaining files:", remainingFiles);

        if (remainingFiles.length === 0) {
          return res
            .status(200)
            .json({ message: "File deleted. Project is now empty.", deleteProject: true });
        }

        res.status(200).json({ message: "File deleted successfully.", deleteProject: false });
      } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "An error occurred while deleting the file." });
      }
    });

    app.delete("/api/projects/:projectId", async (req, res) => {
      try {
        const { projectId } = req.params;

        if (!projectId) {
          return res.status(400).json({ error: "Project ID is required." });
        }

        // Delete all files associated with the project
        await filesCollection.deleteMany({ projectId: new ObjectId(projectId) });

        // Delete the project
        await projectCollection.deleteOne({ _id: new ObjectId(projectId) });

        res.status(200).json({ message: "Project and associated files deleted successfully." });
      } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ error: "An error occurred while deleting the project." });
      }
    });


    app.get("/api/files", async (req, res) => {
      try {
        const { userId, projectId } = req.query;

        if (!userId || !projectId) {
          return res.status(400).json({ error: "User ID and Project ID are required." });
        }

        // Fetch files by userId and projectId
        const files = await filesCollection
          .find({ userId: userId, projectId: new ObjectId(projectId) })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json({ files });
      } catch (error) {
        console.error("Error fetching files:", error);
        res.status(500).json({ error: "An error occurred while fetching files." });
      }
    });


    app.get("/api/logout", (req, res) => {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).json({ message: "Error during logout" });
        }
        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Logged out successfully" });
      });
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
connectToDatabase();

process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});
