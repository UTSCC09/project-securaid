"use client";

import ExifReader from "exifreader"; // Import the ExifReader library
import { useState } from "react";
import "../UploadContentComponent/UploadContentComponent.css";

export function UploadContentComponent({ userId, onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadedLinks, setUploadedLinks] = useState([]);

  const checkImageMetadata = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    try {
      const tags = ExifReader.load(arrayBuffer);

      // Check for suspicious metadata
      const suspiciousMetadata = ["GPSLatitude", "GPSLongitude", "Software", "Comment"];
      for (const key of suspiciousMetadata) {
        if (tags[key]) {
          alert(`Warning: Suspicious metadata detected in ${file.name} - ${key}`);
          return false;
        }
      }

      // Check if the file has steganography indicators (hidden data)
      if (tags["MakerNote"] || tags["UserComment"]) {
        alert(`Warning: Hidden metadata detected in ${file.name}. File might contain steganography.`);
        return false;
      }

      // If no issues, return true
      return true;
    } catch (error) {
      console.warn(`Error reading metadata for ${file.name}:`, error);
      alert(`Error analyzing metadata for ${file.name}. The file cannot be uploaded.`);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.length || !folderName.trim()) {
      alert("Please select files and provide a folder name.");
      return;
    }

    setUploading(true);
    setUploadedLinks([]);

    try {
      // Validate image files
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const isValid = await checkImageMetadata(file);
          if (!isValid) {
            setUploading(false);
            return; // Stop further processing if any file fails validation
          }
        }
      }

      const fileData = Array.from(files).map((file) => ({
        filename: file.name,
        contentType: file.type,
      }));

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderName, files: fileData }),
      });

      if (response.ok) {
        const uploadUrls = await response.json();

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

        const bucketName = "securaid";
        const region = "ca-central-1";
        const fileLinks = uploadUrls.map(({ key }) => ({
          filename: key.split("/").pop(),
          url: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`,
        }));

        setUploadedLinks(fileLinks);

        const owner = "owner";
        const projectResponse = await fetch(
          "http://localhost:4000/api/projects",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              folderName,
              uploadedLinks: fileLinks,
              userId,
              owner,
            }),
          }
        );

        if (projectResponse.ok) {
          const { projectId } = await projectResponse.json();
          console.log(`Project created successfully with ID: ${projectId}`);

          // Notify parent about successful upload
          onUploadSuccess();
        } else {
          alert("Failed to create project in the backend.");
        }
      } else {
        alert("Failed to upload files.");
      }
    } catch (error) {
      console.error("Error during upload and project creation:", error);
      alert("An error occurred during the upload or project creation.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-content-wrapper">
      <div className="title">Upload Files</div>
      <div className="upload-form-display">
        <form className="upload-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="upload-input"
            id="upload-input_text"
          />
          <input
            id="files"
            type="file"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="upload-input"
          />
          <button type="submit" disabled={uploading} className="auth-button">
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        <div id="files-uploaded">
          {uploadedLinks.length > 0 &&
            uploadedLinks.map((file, index) => (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="uploaded-file-link"
                key={index}
              >
                {file.filename.split("_").slice(1).join("_") || file.filename}{" "}
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
