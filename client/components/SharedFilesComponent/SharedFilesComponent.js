import { useEffect, useState } from "react";
import "./SharedFilesComponent.css";

export function SharedFilesComponent({ username }) {
  const [sharedFiles, setSharedFiles] = useState([]);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchSharedFiles = async () => {
      if (!username) {
        console.error("Username is missing."); // Log the issue
        setError("Username is required to fetch shared files.");
        return;
      }

      try {
        console.log("Fetching shared files for username:", username); // Debug log
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

    fetchSharedFiles();
  }, [username]);

  const calculateExpiryAt = (createdAt, expiryTime) => {
    const [hours, minutes] = expiryTime.split(":").map(Number);
    const createdDate = new Date(createdAt);
    createdDate.setHours(createdDate.getHours() + hours);
    createdDate.setMinutes(createdDate.getMinutes() + minutes);
    return formatTime(createdDate);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (sharedFiles.length === 0) {
    return <div className="no-shared-files">No shared files.</div>;
  }

  return (
    <div className="shared-files-wrapper">
      <h2 className="shared-files-header">Files Shared with You</h2>
      <ul className="shared-files-list">
        {sharedFiles.map((file, index) => (
          <li
            key={`${file.fileName}_${file.sharedBy}_${index}`}
            className="shared-file-item"
          >
            <div>File Name: {file.fileName}</div>
            <div>Shared By: {file.sharedBy}</div>
            <div>
              Expires At: {calculateExpiryAt(file.createdAt, file.expiryTime)}
            </div>
            <button className="view-button" onClick={() => {}}>
              View
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
