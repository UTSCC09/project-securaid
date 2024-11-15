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
