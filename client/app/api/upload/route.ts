import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { folderName, files } = await request.json();

  if (!folderName || !files || !Array.isArray(files) || files.length === 0) {
    return new Response(JSON.stringify({ error: "Invalid input." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = new S3Client({ region: process.env.AWS_REGION });
    const urls = await Promise.all(
      files.map(async (file: { filename: string; contentType: string }) => {
        const key = `${folderName}/${uuidv4()}_${file.filename}`;

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
          ContentType: file.contentType,
          ACL: "public-read", // Modify as needed
        });

        const url = await getSignedUrl(client, command, { expiresIn: 600 });
        return { url, key };
      })
    );

    return new Response(JSON.stringify(urls), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating pre-signed URLs:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
