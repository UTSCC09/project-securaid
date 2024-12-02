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
const AWS = require("aws-sdk");
const fetch = require("node-fetch");
const FormData = require("form-data");
const path = require("path");
const dotenv = require("dotenv");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const env = process.env.NODE_ENV || "development";

const envPath = path.resolve(__dirname, `.env.${env}.local`);
dotenv.config({ path: envPath });

const JWT_SECRET = process.env.JWT_SECRET || "@#JFIDFJ#*$)@(32S";
const JWT_EXPIRATION = "1d";

console.log(`Environment loaded from: ${env}`);
const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
console.log(`CORS ALLOWS: ${process.env.FRONTEND_URL}`);

const ensureAuthenticated = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user data to the request
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

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
      callbackURL: "https://securaid-backend.mywire.org/auth/google/callback",
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

    app.post("/api/users", async (req, res) => {
      try {
        const { username, password, email } = req.body;

        if (!email || !email.includes("@")) {
          return res.status(400).json({ message: "Invalid email address." });
        }

        const existingUser = await usersCollection.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          return res.status(409).json({
            message:
              "Username or email already exists. Please choose a different one.",
          });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = {
          username,
          password: hashedPassword,
          email,
        };

        const insertResult = await usersCollection.insertOne(user);
        res.json({
          message: "User registered successfully.",
          userId: insertResult.insertedId,
        });
      } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).json({ message: "Error inserting user" });
      }
    });

    app.post("/api/upload", ensureAuthenticated, async (req, res) => {
      const { folderName, files } = req.body;

      if (!folderName || !files || files.length === 0) {
        return res.status(400).json({ error: "Invalid input data." });
      }

      try {
        const uploadUrls = await Promise.all(
          files.map((file) => {
            const key = `${folderName}/${file.filename}`;
            const params = {
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: key,
              Expires: 60,
              ContentType: file.contentType,
            };
            return s3.getSignedUrlPromise("putObject", params).then((url) => ({
              key,
              url,
            }));
          })
        );

        res.status(200).json(uploadUrls);
      } catch (error) {
        console.error("Error generating upload URLs:", error);
        res.status(500).json({ error: "Failed to generate upload URLs." });
      }
    });

    app.post("/api/virustotal-scan", async (req, res) => {
      const { s3Url } = req.body;

      if (!s3Url) {
        return res.status(400).json({ error: "Missing s3Url." });
      }

      try {
        const fileKey = decodeURIComponent(
          new URL(s3Url).pathname.substring(1)
        );
        const fileStream = s3
          .getObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: fileKey,
          })
          .createReadStream();

        const formData = new FormData();
        formData.append("file", fileStream, fileKey);

        const response = await fetch(
          "https://www.virustotal.com/api/v3/files",
          {
            method: "POST",
            headers: {
              "x-apikey": process.env.VIRUSTOTAL_API_KEY,
              ...formData.getHeaders(),
            },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`VirusTotal error: ${errorText}`);
        }

        const { data } = await response.json();
        res.status(200).json({ scanId: data.id });
      } catch (error) {
        console.error("Error in VirusTotal scan:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to scan file." });
      }
    });

    app.get("/api/virustotal-results", async (req, res) => {
      const { scanId } = req.query;

      if (!scanId) {
        return res.status(400).json({ error: "Missing scanId." });
      }

      try {
        console.log(`Fetching results for scanId: ${scanId}`); // Log the scanId
        const response = await fetch(
          `https://www.virustotal.com/api/v3/analyses/${scanId}`,
          {
            method: "GET",
            headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("VirusTotal API Error Response:", errorText);
          throw new Error("Failed to fetch VirusTotal results.");
        }

        const result = await response.json();
        res.status(200).json(result);
      } catch (error) {
        console.error("Error fetching VirusTotal results:", error);
        res
          .status(500)
          .json({ error: error.message || "Failed to fetch results." });
      }
    });

    app.get(
      "/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get(
      "/auth/google/callback",
      passport.authenticate("google", {
        failureRedirect: "https://securaid.mywire.org",
      }),
      (req, res) => {
        const user = req.user;
        req.session.userId = user._id;
        req.session.loginType = "google"; // Mark as Google login
        res.redirect(`https://securaid.mywire.org?username=${user.username}`);
      }
    );

    app.get("/auth/logout", async (req, res) => {
      const isGoogleUser = req.session.passport?.user?.token; // Check if logged in with Google

      req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });

        res.clearCookie("connect.sid");

        if (isGoogleUser) {
          // Revoke Google token
          const revokeUrl = `https://oauth2.googleapis.com/revoke?token=${isGoogleUser}`;
          fetch(revokeUrl, { method: "POST" })
            .then(() => {
              res.redirect("https://securaid.mywire.org");
            })
            .catch((revokeError) => {
              console.error("Error revoking Google token:", revokeError);
              res.redirect("https://securaid.mywire.org");
            });
        } else {
          // Standard logout
          res.redirect("https://securaid.mywire.org");
        }
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

    app.get("/api/user/:username", async (req, res) => {
      try {
        const { username } = req.params;

        const user = await usersCollection.findOne({ username });

        if (!user || !user.email) {
          return res.status(404).json({ message: "User or email not found." });
        }

        res.json({ email: user.email });
      } catch (error) {
        console.error("Error fetching user email:", error);
        res.status(500).json({ message: "Failed to retrieve user email." });
      }
    });

    // app.post(
    //   "/api/users/login",
    //   [
    //     body("usernameOrEmail").isString().trim().escape(),
    //     body("password").isString().trim().escape(),
    //   ],

    //   async (req, res) => {
    //     try {
    //       const { usernameOrEmail, password } = req.body;

    //       const user = await usersCollection.findOne({
    //         $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    //       });

    //       if (!user || !(await bcrypt.compare(password, user.password))) {
    //         return res.status(401).json({ message: "Invalid credentials." });
    //       }

    //       req.session.userId = user._id;
    //       res.json({ message: "Login successful", username: user.username });
    //     } catch (error) {
    //       console.error("Error during login:", error);
    //       res.status(500).json({ message: "Error during login." });
    //     }
    //   }
    // );

    app.post("/api/users/login", async (req, res) => {
      try {
        const { usernameOrEmail, password } = req.body;

        const user = await usersCollection.findOne({
          $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
        });

        if (!user) {
          return res.status(404).json({ message: "User not found." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Incorrect password." });
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, username: user.username },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRATION }
        );

        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production", // Set to true in production
          maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        res.json({ message: "Login successful", username: user.username });
      } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Error during login." });
      }
    });

    app.post("/api/projects", async (req, res) => {
      try {
        const { folderName, uploadedLinks, userId, ownership } = req.body;

        // Validate input
        if (
          !folderName ||
          !uploadedLinks ||
          !Array.isArray(uploadedLinks) ||
          uploadedLinks.length === 0 ||
          !userId
        ) {
          return res.status(400).json({
            error:
              "Invalid input. Folder name, user ID, and file links are required.",
          });
        }

        // Check if a project with the same folder name exists for the user
        let project = await projectCollection.findOne({ folderName, userId });

        let projectId;
        if (project) {
          // If the project exists, use its ID
          projectId = project._id;
        } else {
          // Create a new project if it doesn't exist
          project = {
            folderName,
            userId,
            ownership,
            createdAt: new Date(),
          };

          const insertResult = await projectCollection.insertOne(project);
          projectId = insertResult.insertedId;
        }

        // Prepare file documents to insert
        const fileDocuments = uploadedLinks.map((file) => ({
          projectId,
          userId,
          filename: file.filename,
          url: file.url,
          scanId: file.scanId || null, // Include scanId
          ownership,
          createdAt: new Date(),
        }));

        // Insert files into the files collection
        await filesCollection.insertMany(fileDocuments);

        // Respond with success message and project ID
        res.status(201).json({
          message: project
            ? "Files added to existing project successfully"
            : "Project and files created successfully",
          projectId,
        });
      } catch (error) {
        console.error("Error processing request:", error);
        res
          .status(500)
          .json({ error: "An error occurred while processing the request." });
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
        res
          .status(500)
          .json({ error: "An error occurred while fetching projects." });
      }
    });

    app.get("/api/protected", ensureAuthenticated, async (req, res) => {
      const user = await usersCollection.findOne({
        _id: new ObjectId(req.user.userId),
      });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      res.json({ username: user.username });
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
      res.clearCookie("auth_token");
      res.status(200).json({ message: "Logged out successfully" });
    });

    app.post("/api/share-file", async (req, res) => {
      try {
        const { sharedTo, sharedBy, fileName, expiryTime, fileUrl } = req.body;

        if (!sharedTo || !sharedBy || !fileName || !expiryTime || !fileUrl) {
          return res.status(400).json({ error: "All fields are required." });
        }

        const sharedFile = {
          sharedTo,
          sharedBy,
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
        //console.log("Shared files fetched:", sharedFiles);

        res.status(200).json({ sharedFiles });
      } catch (error) {
        console.error("Error in shared files endpoint:", error);
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
    // code was adapted from chatgpt to set up nodemailer otp generation and verification. Link in credits page
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
