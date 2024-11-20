import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fetch from "node-fetch";
import FormData from "form-data";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY;

// Named export for the POST method
export async function POST(req) {
  try {
    const body = await req.json();
    const { s3Url } = body;

    if (!s3Url) {
      return new Response(
        JSON.stringify({ error: "Invalid input: Missing s3Url." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      const scanId = await scanFileFromS3(s3Url);
      return new Response(JSON.stringify({ scanId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error scanning file from S3:", error);
      return new Response(
        JSON.stringify({ error: error.message || "Unknown error occurred." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Helper function to download file from S3 and send it to VirusTotal
async function scanFileFromS3(s3Url) {
  try {
    console.log("Downloading file from S3 URL:", s3Url);

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: new URL(s3Url).pathname.substring(1), // Extract S3 key from URL
    });

    const { Body } = await s3Client.send(command);

    if (!Body) {
      throw new Error("Failed to download file from S3.");
    }

    console.log("File successfully downloaded from S3.");

    const formData = new FormData();
    formData.append("file", Body, "file_from_s3");

    const response = await fetch("https://www.virustotal.com/api/v3/files", {
      method: "POST",
      headers: {
        "x-apikey": virusTotalApiKey,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("VirusTotal API Error Response:", errorText);
      throw new Error(`VirusTotal scan failed: ${errorText}`);
    }

    const data = await response.json();
    return data.data.id;
  } catch (error) {
    console.error("Error in scanFileFromS3:", error);
    throw error;
  }
}
