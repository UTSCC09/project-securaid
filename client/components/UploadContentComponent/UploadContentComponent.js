"use client";

import { useState } from "react";
import "../UploadContentComponent/UploadContentComponent.css";

export function UploadContentComponent({ userId, onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadedLinks, setUploadedLinks] = useState([]);

  const scanWithVirusTotal = async (filePath) => {
    try {
      console.log("Sending file to VirusTotal:", filePath);
      const response = await fetch("/api/virustotal-scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ s3Url: filePath }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("VirusTotal Error Response:", errorText);
        throw new Error("Failed to scan file.");
      }

      const result = await response.json();
      console.log("VirusTotal Response:", result);
      return result.scanId;
    } catch (error) {
      console.error("Error scanning with VirusTotal:", error);
      alert("An error occurred while scanning the file.");
      return null;
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
      const fileData = Array.from(files).map((file) => ({
        filename: file.name,
        contentType: file.type,
      }));

      // Step 1: Get pre-signed URLs from the backend
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, files: fileData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload Error Response:", errorText);
        alert("Failed to upload files.");
        return;
      }

      const uploadUrls = await response.json();

      // Step 2: Upload files to S3
      await Promise.all(
        uploadUrls.map(({ url }, index) =>
          fetch(url, {
            method: "PUT",
            headers: { "Content-Type": files[index].type },
            body: files[index],
          })
        )
      );

      const fileLinks = uploadUrls.map(({ key }) => ({
        filename: key.split("/").pop(),
        url: `https://securaid.s3.ca-central-1.amazonaws.com/${key}`,
      }));

      setUploadedLinks(fileLinks);

      // Step 3: Scan each uploaded file with VirusTotal
      const scanResults = await Promise.all(
        fileLinks.map((fileLink) =>
          scanWithVirusTotal(fileLink.url).catch((error) => {
            console.error(`Error scanning ${fileLink.filename}:`, error);
            return null; // Skip failed scans
          })
        )
      );

      console.log("VirusTotal Scan Results:", scanResults);

      if (onUploadSuccess) onUploadSuccess(scanResults);
    } catch (error) {
      console.error("Error during upload and VirusTotal scan:", error);
      alert("An error occurred during the upload or scanning.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-content-wrapper">
      <div className="title">Upload Files</div>
      <form className="upload-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Folder Name"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          className="upload-input"
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
              {file.filename}
            </a>
          ))}
      </div>
    </div>
  );
}
