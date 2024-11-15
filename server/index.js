const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 4000;

app.use(cors({
    origin: "http://localhost:3000", // Replace with the specific frontend origin
    credentials: true, // Allow credentials to be included in requests
  }));
  app.use(express.json())
app.use(cookieParser());

// MongoDB connection setup
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

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

    app.use(function (req, res, next) {
        if (req.cookies.username) {
            req.username = req.cookies.username;
            console.log("HTTPS request", req.username, req.method, req.url, req.body);
        }
        next();
      });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });


// Route to register a new user
app.post("/api/users", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Check if a user with the same username already exists
      const existingUser = await usersCollection.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists. Please choose a different username." });
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

      app.post("/api/users/login", async (req, res) => {
        console.log("GOT TO LOGIN/SIGNIN")
        try {
          const { username, password } = req.body;

          // Find the user by username
          const user = await usersCollection.findOne({ username });
          if (!user) {
            return res.status(404).json({ message: "No user found with that username" });
          }

          // Check if the password is correct
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return res.status(401).json({ message: "Incorrect password" });
          }
          res.cookie("username", username, {
            httpOnly: true, // Prevents JavaScript access to the cookie
            secure: false, // Set to true if using HTTPS
            maxAge: 24 * 60 * 60 * 1000 // Cookie expiration (1 day)
          });

          // Successful login
          res.json({ message: "Login successful", userId: user._id });
        } catch (error) {
          console.error("Error during login:", error);
          res.status(500).json({ message: "Error during login" });
        }
      });

      app.get("/api/protected", (req, res) => {
        if (!req.cookies.username) {
          return res.status(401).json({ message: "Unauthorized. Please log in." });
        }
        res.json({ message: `Welcome, ${req.cookies.username}! This is a protected route.` });
      });

      app.post("/api/logout", (req, res) => {
        // Clear the "username" cookie by setting its expiration date to the past
        res.cookie("username", "", { maxAge: 0, httpOnly: true, secure: false });
        res.json({ message: "Sign-out successful" });
      });

    //   // Example route to read a user by ID
    //   app.get("/api/users/:id", async (req, res) => {
    //     try {
    //       const userId = req.params.id;
    //       const user = await usersCollection.findOne({ _id: new MongoClient.ObjectId(userId) });
    //       if (user) {
    //         res.json(user);
    //       } else {
    //         res.status(404).json({ message: "User not found" });
    //       }
    //     } catch (error) {
    //       console.error("Error reading user:", error);
    //       res.status(500).json({ message: "Error reading user" });
    //     }
    //   });

  } catch (error) {
    console.error("An error occurred:", error);
  }
}
connectToDatabase();

process.on('SIGINT', async () => {
  await client.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});
