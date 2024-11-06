// route.js
"use server";

import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import mongoose from "mongoose";

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB using Mongoose");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const FileSchema = new mongoose.Schema({
  fileName: String,
  fileUrl: String,
  uploadDate: { type: Date, default: Date.now },
});

const FileModel = mongoose.model("File", FileSchema);

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const POST = async (req) => {
  try {
    const fileName = `${nanoid()}`; // Generate a unique file name
    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.AWS_BUCKET_NAME || "",
      Key: `uploads/${fileName}`,
      Expires: 60, // Presigned URL expiration time in seconds
    });

    return NextResponse.json({ url, fields, fileName });
  } catch (error) {
    return NextResponse.error({
      status: 500,
      body: "Error generating presigned URL",
    });
  }
};
