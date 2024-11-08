"use client";

import { useState } from "react";

export function UploadContentComponent() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadedLinks, setUploadedLinks] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.length || !folderName.trim()) {
      alert("Please select files and provide a folder name.");
      return;
    }

    setUploading(true);
    setUploadedLinks([]);

    try {
      const fileData = Array.from(files).map((file) => ({
        filename: file.name,
        contentType: file.type,
      }));

      // Request to get pre-signed URLs
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName, files: fileData }),
      });

      if (response.ok) {
        const uploadUrls = await response.json();

        // Upload each file to S3
        await Promise.all(
          uploadUrls.map(({ url }, index) =>
            fetch(url, {
              method: "PUT",
              headers: {
                "Content-Type": files[index].type,
              },
              body: files[index],
            })
          )
        );

        // Create individual file links and set the state
        const bucketName = "securaid";
        const region = "ca-central-1";
        const fileLinks = uploadUrls.map(({ key }) => ({
          filename: key.split("/").pop(), // Display the filename
          url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
        }));

        setUploadedLinks(fileLinks);
      } else {
        alert("Failed to get pre-signed URLs.");
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
      <h1>Upload Files to S3</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
        <input
          id="files"
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
        />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {uploadedLinks.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2>Uploaded Files:</h2>
          <ul>
            {uploadedLinks.map((file, index) => (
              <li key={index}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
