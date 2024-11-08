"use client";

import { useState } from "react";

export function UploadContentComponent() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setUploading(true);

    try {
      // Request to get the pre-signed URL
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (response.ok) {
        const { url } = await response.json();

        // Upload the file to S3
        const uploadResponse = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (uploadResponse.ok) {
          alert("Upload successful!");
        } else {
          console.error("S3 Upload Error:", uploadResponse);
          alert("Upload failed.");
        }
      } else {
        alert("Failed to get pre-signed URL.");
      }
    } catch (error) {
      console.error("Error during upload:", error);
      alert("An error occurred during the upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main>
      <h1>Upload a File to S3</h1>
      <form onSubmit={handleSubmit}>
        <input
          id="file"
          type="file"
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              setFile(files[0]);
            }
          }}
          accept="image/png, image/jpeg"
        />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </main>
  );
}
