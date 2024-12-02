"use client";
//import ExifReader from "exifreader";
import { useState } from "react";
import "../UploadContentComponent/UploadContentComponent.css";
import { useSnackbar } from "notistack";

export function UploadContentComponent({
  userId,
  onUploadSuccess,
  refreshTrigger,
}) {
  const { enqueueSnackbar } = useSnackbar();

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadedLinks, setUploadedLinks] = useState([]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  // const checkImageMetadata = async (file) => {
  //   const arrayBuffer = await file.arrayBuffer();
  //   try {
  //     const tags = ExifReader.load(arrayBuffer);

  //     // Check for suspicious metadata
  //     const suspiciousMetadata = [
  //       "GPSLatitude",
  //       "GPSLongitude",
  //       "Software",
  //       "Comment",
  //     ];
  //     for (const key of suspiciousMetadata) {
  //       if (tags[key]) {
  //         enqueueSnackbar(
  //           `Warning: Suspicious metadata detected in ${file.name} - ${key}`,
  //           { variant: "warning" }
  //         );
  //         return false;
  //       }
  //     }

  //     // Check if the file has steganography indicators (hidden data)
  //     if (tags["MakerNote"] || tags["UserComment"]) {
  //       enqueueSnackbar(
  //         `Warning: Hidden metadata detected in ${file.name}. File might contain steganography.`,
  //         { variant: "warning" }
  //       );
  //       return false;
  //     }

  // //     // If no issues, return true
  //     return true;
  //   } catch (error) {
  //     console.warn(`Error reading metadata for ${file.name}:`, error);
  //     enqueueSnackbar(
  //       `Error analyzing metadata for ${file.name}. The file cannot be uploaded.`,
  //       { variant: "error" }
  //     );
  //     return false;
  //   }
  // };

  const scanWithVirusTotal = async (filePath) => {
    try {
      //console.log("Sending file to VirusTotal:", filePath);
      const response = await fetch(`${backendUrl}/api/virustotal-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ s3Url: filePath }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("VirusTotal Error Response:", errorText);
        throw new Error("Failed to scan file.");
      }

      const result = await response.json();
      //console.log("VirusTotal Response:", result);
      return result.scanId;
    } catch (error) {
      console.error("Error scanning with VirusTotal:", error);
      enqueueSnackbar("An error occurred while scanning the file.", {
        variant: "error",
      });
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length || !folderName.trim()) {
      enqueueSnackbar("Please select files and provide a folder name.", {
        variant: "error",
      });
      return;
    }

    setUploading(true);

    try {
      const fileData = Array.from(files).map((file) => ({
        filename: file.name,
        contentType: file.type,
      }));

      const response = await fetch(`${backendUrl}/api/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, files: fileData }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload Error Response:", errorText);
        enqueueSnackbar("Failed to upload files.", { variant: "error" });
        return;
      }

      const uploadUrls = await response.json();

      await Promise.all(
        uploadUrls.map(({ url }, index) =>
          fetch(url, {
            method: "PUT",
            headers: { "Content-Type": files[index].type },
            body: files[index],
            credentials: "include",
          })
        )
      );
      enqueueSnackbar("Files uploaded successfully!", { variant: "success" });

      const fileLinks = uploadUrls.map(({ key }) => ({
        filename: key.split("/").pop(),
        url: `https://securaid.s3.ca-central-1.amazonaws.com/${key}`,
      }));

      const scanResults = await Promise.all(
        fileLinks.map(async (fileLink) => {
          const scanId = await scanWithVirusTotal(fileLink.url);
          return { ...fileLink, scanId };
        })
      );
      //console.log("Scan results:", scanResults);

      const projectResponse = await fetch(`${backendUrl}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderName,
          uploadedLinks: scanResults,
          userId,
        }),
      });
      //console.log("Final uploadedLinks:", scanResults);

      if (!projectResponse.ok) {
        throw new Error("Failed to create project in the backend.");
      } else if (projectResponse.ok) {
        setUploadedLinks(scanResults);
      }

      const { projectId } = await projectResponse.json();
      //console.log(`Project created successfully with ID: ${projectId}`);

      if (onUploadSuccess) {
        onUploadSuccess({ uploadedFiles: fileLinks, scanResults });
      }
    } catch (error) {
      console.error("Error during upload and project creation:", error);
      enqueueSnackbar(
        "An error occurred during the upload or project creation.",
        { variant: "error" }
      );
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
