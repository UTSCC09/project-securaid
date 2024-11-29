const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const nodemailer = require("nodemailer");
const { body, param, query, validationResult } = require("express-validator");


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
let usersCollection;
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;



// Configure Passport
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:4000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id, displayName, emails } = profile;
        const email = emails[0].value;

        // Check if user exists in the database
        let user = await usersCollection.findOne({ googleId: id });

        if (!user) {
          // Create a new user
          user = {
            googleId: id,
            username: displayName,
            email,
          };
          await usersCollection.insertOne(user);
        }

        done(null, user); // Pass the user to the next middleware
      } catch (error) {
        done(error, null);
      }
    }
  )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

const ensureAuthenticated = (req, res, next) => {
  console.log("Current session:", req.session);
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized. Please log in." });
};

// Input validation and sanitization
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("securaid");
    usersCollection = database.collection("users");
    const filesCollection = database.collection("files");
    const projectCollection = database.collection("projects");
    const sharedFilesCollection = database.collection("sharedFiles");
    const otps = new Map();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "securaid.otp@gmail.com",
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    app.post(
      "/api/users",
      [
        body("username").isString().trim().escape().notEmpty(),
        body("password").isString().trim().isLength({ min: 6 }).escape(),
        body("email").isEmail().normalizeEmail(),
      ],
      validateRequest, // This middleware checks validation results
      async (req, res) => {
        try {
          const { username, password, email } = req.body;

          const existingUser = await usersCollection.findOne({
            $or: [{ username }, { email }],
          });
          if (existingUser) {
            return res.status(409).json({
              message: "Username or email already exists. Please choose a different one.",
            });
          }

          const hashedPassword = await bcrypt.hash(password, 10);

          const user = { username, password: hashedPassword, email };
          const insertResult = await usersCollection.insertOne(user);

          res.json({ message: "User registered successfully.", userId: insertResult.insertedId });
        } catch (error) {
          console.error("Error inserting user:", error);
          res.status(500).json({ message: "Error inserting user" });
        }
      }
    );

    app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "http://localhost:3000" }),
      (req, res) => {
        const user = req.user; // Get the authenticated user
        // Store user ID in the session
        req.session.userId = user._id; // Assuming MongoDB ObjectId
        console.log("Session userId set:", req.session.userId);

        res.redirect(`http://localhost:3000?username=${user.username}`);
      }
    );



    app.get("/auth/logout", (req, res) => {
      req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.clearCookie("session");
        res.redirect("http://localhost:3000");
      });
    });


    app.get("/api/all-users", async (req, res) => {
      try {
        const users = await usersCollection.find({}).toArray();
        res.status(200).json({ users });
      } catch (error) {
        console.error("Error fetching all users:", error);
        res.status(500).json({ error: "Failed to fetch users." });
      }
    });

    app.get(
      "/api/user/:username",
      [
        param("username").isString().trim().escape(),
      ],
      validateRequest,
      ensureAuthenticated,
      async (req, res) => {
        try {
          const { username } = req.params;

          const user = await usersCollection.findOne({ username });
          if (!user) {
            return res.status(404).json({ message: "User not found." });
          }

          res.json({ email: user.email });
        } catch (error) {
          console.error("Error fetching user email:", error);
          res.status(500).json({ message: "Failed to retrieve user email." });
        }
      }
    );

    app.post(
      "/api/users/login",
      [
        body("usernameOrEmail").isString().trim().escape(),
        body("password").isString().trim().escape(),
      ],
      validateRequest,
      async (req, res) => {
        try {
          const { usernameOrEmail, password } = req.body;

          const user = await usersCollection.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
          });

          if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials." });
          }

          req.session.userId = user._id;
          res.json({ message: "Login successful", username: user.username });
        } catch (error) {
          console.error("Error during login:", error);
          res.status(500).json({ message: "Error during login." });
        }
      }
    );

    app.post(
      "/api/projects",
      [
        body("folderName").isString().trim().escape(),
        body("uploadedLinks").isArray(),
        body("userId").isString().trim().escape(),
        body("ownership").isString().trim().escape(),
      ],
      validateRequest,
      ensureAuthenticated,
      async (req, res) => {
        console.log("Received data:", req.body);
        try {
          const { folderName, uploadedLinks, userId, ownership } = req.body;

          const project = await database.collection("projects").findOne({ folderName, userId });

          let projectId;
          if (project) {
            projectId = project._id;
          } else {
            const insertResult = await database.collection("projects").insertOne({
              folderName,
              userId,
              ownership,
              createdAt: new Date(),
            });
            projectId = insertResult.insertedId;
          }

          const fileDocuments = uploadedLinks.map((file) => ({
            projectId,
            userId,
            filename: file.filename,
            url: file.url,
            ownership,
            createdAt: new Date(),
          }));

          await database.collection("files").insertMany(fileDocuments);

          res.status(201).json({ message: "Project and files created successfully.", projectId });
        } catch (error) {
          console.error("Error processing request:", error);
          res.status(500).json({ message: "Error processing request." });
        }
      }
    );

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
        res
          .status(500)
          .json({ error: "An error occurred while fetching projects." });
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
          return res.status(200).json({
            message: "File deleted. Project is now empty.",
            deleteProject: true,
          });
        }

        res.status(200).json({
          message: "File deleted successfully.",
          deleteProject: false,
        });
      } catch (error) {
        console.error("Error deleting file:", error);
        res
          .status(500)
          .json({ error: "An error occurred while deleting the file." });
      }
    });

    app.delete("/api/projects/:projectId", async (req, res) => {
      try {
        const { projectId } = req.params;

        if (!projectId) {
          return res.status(400).json({ error: "Project ID is required." });
        }

        // Delete all files associated with the project
        await filesCollection.deleteMany({
          projectId: new ObjectId(projectId),
        });

        // Delete the project
        await projectCollection.deleteOne({ _id: new ObjectId(projectId) });

        res.status(200).json({
          message: "Project and associated files deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting project:", error);
        res
          .status(500)
          .json({ error: "An error occurred while deleting the project." });
      }
    });
    app.delete("/api/delete-shared-file/:fileId", async (req, res) => {
      try {
        const { fileId } = req.params;
        await sharedFilesCollection.deleteOne({ _id: new ObjectId(fileId) });
        res.status(200).json({ message: "File deleted successfully." });
      } catch (error) {
        console.error("Error deleting shared file:", error);
        res.status(500).json({ error: "Failed to delete shared file." });
      }
    });

    app.get("/api/files", async (req, res) => {
      try {
        const { userId, projectId } = req.query;

        if (!userId || !projectId) {
          return res
            .status(400)
            .json({ error: "User ID and Project ID are required." });
        }

        // Fetch files by userId and projectId
        const files = await filesCollection
          .find({ userId: userId, projectId: new ObjectId(projectId) })
          .sort({ createdAt: -1 })
          .toArray();

        res.status(200).json({ files });
      } catch (error) {
        console.error("Error fetching files:", error);
        res
          .status(500)
          .json({ error: "An error occurred while fetching files." });
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

    app.post("/api/share-file", async (req, res) => {
      try {
        const { sharedTo, sharedBy, fileName, expiryTime, fileUrl } = req.body;

        // Validate input
        if (!sharedTo || !sharedBy || !fileName || !expiryTime || !fileUrl) {
          return res.status(400).json({ error: "All fields are required." });
        }

        // Create the shared file document
        const sharedFile = {
          sharedTo, // Username of the recipient
          sharedBy, // Username of the sharer
          fileName,
          expiryTime,
          fileUrl,
          createdAt: new Date(),
        };

        await sharedFilesCollection.insertOne(sharedFile);

        res.status(201).json({ message: "File shared successfully." });
      } catch (error) {
        console.error("Error sharing file:", error);
        res.status(500).json({ error: "Failed to share the file." });
      }
    });

    app.get("/api/shared-files", async (req, res) => {
      try {
        const { username } = req.query;
        console.log("Shared files endpoint hit with username:", username); // Debug log

        if (!username) {
          console.error("No username provided");
          return res.status(400).json({ error: "Username is required." });
        }

        const sharedFiles = await sharedFilesCollection
          .find({ sharedTo: username })
          .toArray();
        console.log("Shared files fetched:", sharedFiles); // Debug log

        res.status(200).json({ sharedFiles });
      } catch (error) {
        console.error("Error in shared files endpoint:", error); // Debug log
        res.status(500).json({ error: "Failed to fetch shared files." });
      }
    });

    app.post("/api/generate-otp", async (req, res) => {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

      otps.set(email, { otp, expiresAt });

      try {
        await transporter.sendMail({
          from: '"securaid" <securaid.otp@gmail.com>',
          to: email,
          subject: "Your OTP Code",
          text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
        });

        res.status(200).json({ message: "OTP sent successfully." });
      } catch (error) {
        console.error("Error sending OTP email:", error);
        res.status(500).json({ message: "Failed to send OTP." });
      }
    });

    app.post("/api/verify-otp", (req, res) => {
      const { email, otp } = req.body;

      const storedOtp = otps.get(email);
      if (!storedOtp || storedOtp.expiresAt < Date.now()) {
        return res.status(400).json({ message: "OTP expired or not found." });
      }

      if (storedOtp.otp === otp) {
        otps.delete(email); // Clear OTP after successful validation
        res.status(200).json({ message: "OTP verified successfully." });
      } else {
        res.status(400).json({ message: "Invalid OTP." });
      }
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
