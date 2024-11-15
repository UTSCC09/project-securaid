const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
// import { NextResponse } from "next/server";
const session = require("express-session");
const { serialize } = require("cookie");

const app = express();
const PORT = 4000;

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with the specific frontend origin
    credentials: true, // Allow credentials to be included in requests
  })
);
app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: "kobe",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
}));

// Middleware to parse username from cookies
app.use((req, res, next) => {
  req.username = req.cookies.username || null;
  console.log("HTTPS request", req.username, req.method, req.url, req.body);
  next();
});



// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("securaid");
    const usersCollection = database.collection("users");
    const filesCollection = database.collection("files");

    // Route to test server
    app.get("/api/home", (req, res) => {
      res.json({ message: "hello world" });
    });

    // Route to register a new user
    app.post("/api/users", async (req, res) => {
      try {
        const { username, password } = req.body;

        // Check if a user with the same username already exists
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
          return res.status(409).json({
            message:
              "Username already exists. Please choose a different username.",
          });
        }

        // Hash and salt the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user object with hashed password
        const user = {
          username,
          password: hashedPassword,
        };

        // Insert the new user into the database
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

        // Find the user by username
        const user = await usersCollection.findOne({ username });
        if (!user) {
          return res
            .status(404)
            .json({ message: "No user found with that username" });
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Incorrect password" });
        }

        // Set a cookie for the username
        res.cookie("username", username, {
          httpOnly: true, // Prevents JavaScript access to the cookie
          secure: false, // Set to true if using HTTPS
          maxAge: 24 * 60 * 60 * 1000, // Cookie expiration (1 day)
        });

        // Successful login
        res.json({ message: "Login successful", userId: user._id });
      } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Error during login" });
      }
    });

    // Protected route example
    app.get("/api/protected", (req, res) => {
      if (!req.username) {
        return res
          .status(401)
          .json({ message: "Unauthorized. Please log in." });
      }
      res.json({
        message: `Welcome, ${req.username}! This is a protected route.`,
      });
    });

    // Route for user logout
    app.get("/api/logout/", function (req, res) {
        if (req.session) {
            req.session.destroy(() => {
                res.setHeader(
                    "Set-Cookie",
                    serialize("username", "", {
                        path: "/",
                        maxAge: 0, // Expire the cookie immediately
                        secure: true,
                        sameSite: "strict",
                        httpOnly: true,
                    })
                );
                console.log("Signout from backend")
                res.status(200).json({ message: "Logged out successfully" });
            });
        } else {
            res.status(200).json({ message: "No active session to log out." });
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
