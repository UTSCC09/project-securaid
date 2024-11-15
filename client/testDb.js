// Load environment variables
require('dotenv').config({ path: '.env.local' }); // Explicitly load from .env.local

const { MongoClient } = require('mongodb');

async function testMongoDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is undefined. Check your .env.local file.");
    return;
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const database = client.db("users"); // Replace with your database name
    const collection = database.collection("users"); // Replace with your collection name

    // Write operation
    const testDocument = { name: "Test", description: "Testing MongoDB connection", password: "cuybt" };
    const insertResult = await collection.insertOne(testDocument);
    console.log("Document inserted:", insertResult.insertedId);

    // Read operation
    const readResult = await collection.findOne({ _id: insertResult.insertedId });
    console.log("Document read from MongoDB:", readResult);

  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

testMongoDB();
