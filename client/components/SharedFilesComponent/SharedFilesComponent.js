import { useEffect, useState } from "react";
import "./SharedFilesComponent.css";

export function SharedFilesComponent({ username }) {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [fileToView, setFileToView] = useState(null); // State to store file URL for viewing

  const formatTime = (date) => {
    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt) => {
    const now = new Date();
    return new Date(expiresAt) < now;
  };

  const fetchSharedFiles = async () => {
    if (!username) {
      setError("Username is required to fetch shared files.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:4000/api/shared-files?username=${username}`
      );

      if (response.ok) {
        const { sharedFiles } = await response.json();
        setSharedFiles(sharedFiles);
      } else {
        const { error } = await response.json();
        setError(error || "Failed to fetch shared files.");
      }
    } catch (err) {
      console.error("Error fetching shared files:", err);
      setError("An unexpected error occurred.");
    }
  };

  const calculateExpiryAt = (createdAt, expiryTime) => {
    const [hours, minutes] = expiryTime.split(":").map(Number);
    const createdDate = new Date(createdAt);
    createdDate.setHours(createdDate.getHours() + hours);
    createdDate.setMinutes(createdDate.getMinutes() + minutes);
    return createdDate;
  };

  const handleDelete = async (fileId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/delete-shared-file/${fileId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setSharedFiles((prevFiles) =>
          prevFiles.filter((file) => file._id !== fileId)
        );
        alert("File successfully deleted!");
      } else {
        alert("Failed to delete file. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("An error occurred while deleting the file.");
    }
  };

  const handleView = (fileUrl) => {
    setFileToView(fileUrl); // Set the file URL to view
  };

  const closeViewer = () => {
    setFileToView(null); // Close the viewer
  };

  useEffect(() => {
    fetchSharedFiles();

    const intervalId = setInterval(() => {
      fetchSharedFiles();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [username]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (sharedFiles.length === 0) {
    return <div className="no-shared-files">No shared files.</div>;
  }

  const isImage = (file) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const extension = file.split(".").pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  return (
    <div className="shared-files-wrapper">
      <h2 className="shared-files-header">Files Shared with You</h2>
      <ul className="shared-files-list">
        {sharedFiles.map((file, index) => {
          const expiresAt = calculateExpiryAt(file.createdAt, file.expiryTime);
          return (
            <li
              key={`${file.fileName}_${file.sharedBy}_${index}`}
              className="shared-file-item"
            >
              <div className="file-details">
                <div>File Name: {file.fileName}</div>
                <div>Shared By: {file.sharedBy}</div>
                <div>Expires At: {formatTime(expiresAt)}</div>
              </div>
              <div className="file-actions">
                {isExpired(expiresAt) ? (
                  <button className="expired-button" disabled>
                    Expired
                  </button>
                ) : (
                  <button
                    className="view-button"
                    onClick={() => handleView(file.fileUrl)}
                  >
                    View
                  </button>
                )}
                <button
                  className="delete-button"
                  onClick={() => handleDelete(file._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {fileToView && (
        <div className="file-viewer-modal">
          <div className="file-viewer-content">
            {isImage(fileToView) ? (
              <img
                src={fileToView}
                alt="Uploaded file"
                className="file-viewer-image"
              />
            ) : (
              <iframe
                src={fileToView}
                className="file-viewer-frame"
                title="File Viewer"
              ></iframe>
            )}
            <div className="close-button-container">
              <button className="close-button" onClick={closeViewer}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
