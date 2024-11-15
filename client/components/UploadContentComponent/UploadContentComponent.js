import { useState } from "react";
import "../UploadContentComponent/UploadContentComponent.css";

export function UploadContentComponent() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [uploadedLinks, setUploadedLinks] = useState([]);
  const author = "placeholder_author"; // Placeholder for author

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
          size: files[index].size,
        }));

        setUploadedLinks(fileLinks);

        // Send file links, metadata, and author info to the backend
        await fetch("/api/upload/fileUpload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderName, files: fileLinks, author }), // Include author info
        });
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
