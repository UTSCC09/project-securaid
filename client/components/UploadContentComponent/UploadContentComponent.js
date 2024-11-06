// UploadContentComponent.js
import { useRef, useState } from "react";
import "./UploadContentComponent.css";

export function UploadContentComponent() {
  const uploadFileRef = useRef(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileSelection = () => {
    const files = uploadFileRef.current.files;
    const fileData = Array.from(files).map((file) => ({
      name: file.name,
    }));
    setUploadedFiles(fileData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const files = uploadFileRef.current.files;
    if (files.length === 0) return;

    for (const file of files) {
      try {
        // Request presigned URL from the server
        const response = await fetch("/api/upload", {
          method: "POST",
        });
        const { url, fields, fileName } = await response.json();

        // Prepare form data to send to S3
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append("file", file);

        // Upload the file directly to S3
        const s3Response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (s3Response.ok) {
          console.log(`File ${fileName} uploaded successfully`);
        } else {
          console.error("Failed to upload file to S3");
        }
      } catch (error) {
        console.error("Error uploading files:", error);
      }
    }

    setUploadedFiles([]); // Clear the uploaded files list
    uploadFileRef.current.value = ""; // Reset the file input
  };

  return (
    <div className="upload_container">
      <form id="upload-form" onSubmit={handleSubmit}>
        <div className="form-title">Upload Project</div>
        <input
          type="file"
          name="directory"
          className="form-element"
          ref={uploadFileRef}
          required
          multiple
          onChange={handleFileSelection}
        />
        <button type="submit" className="form-element" id="submit">
          Submit
        </button>
      </form>
      <div id="files-uploaded">
        {uploadedFiles.length > 0 &&
          uploadedFiles.map((file, index) => (
            <div className="uploaded-file" key={index}>
              {file.name}
            </div>
          ))}
      </div>
    </div>
  );
}
