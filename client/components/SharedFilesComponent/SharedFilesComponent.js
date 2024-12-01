import { useEffect, useState } from "react";
import "./SharedFilesComponent.css";
import { useSnackbar } from "notistack";

export function SharedFilesComponent({ username }) {
  const { enqueueSnackbar } = useSnackbar();
  const [sharedFiles, setSharedFiles] = useState([]);
  const [error, setError] = useState(null);
  const [fileToView, setFileToView] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expiryTime, setExpiryTime] = useState(null);

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
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const isExpired = (expiresAt) => {
    const now = new Date();
    return new Date(expiresAt) < now;
  };

  const isImage = (file) => {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];
    const extension = file.split(".").pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  const fetchSharedFiles = async () => {
    if (!username) {
      setError("Username is required to fetch shared files.");
      return;
    }

    try {
      const response = await fetch(
        `${backendUrl}/api/shared-files?username=${username}`
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
        `${backendUrl}/api/delete-shared-file/${fileId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setSharedFiles((prevFiles) =>
          prevFiles.filter((file) => file._id !== fileId)
        );
        enqueueSnackbar("File successfully deleted!", { variant: "success" });
      } else {
        enqueueSnackbar("Failed to delete file. Please try again.", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      enqueueSnackbar("An error occurred while deleting the file.", {
        variant: "error",
      });
    }
  };

  const requestOtp = async (email) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/generate-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (response.ok) {
        enqueueSnackbar("OTP sent to your email.", { variant: "success" });
      } else {
        const errorData = await response.json();
        enqueueSnackbar(errorData.message || "Failed to send OTP.", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      enqueueSnackbar("An error occurred while requesting OTP.", {
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (file) => {
    try {
      const response = await fetch(`${backendUrl}/api/user/${username}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user email.");
      }

      const { email } = await response.json();
      setCurrentEmail(email);
      setRequiresOtp(true);
      setPendingFile(file);
      setExpiryTime(calculateExpiryAt(file.createdAt, file.expiryTime));
      await requestOtp(email);
    } catch (error) {
      console.error("Error fetching user email:", error);
      enqueueSnackbar("An error occurred while retrieving your email.", {
        variant: "error",
      });
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentEmail, otp }),
        credentials: "include",
      });

      if (response.ok) {
        enqueueSnackbar("OTP verified successfully.", { variant: "success" });
        setRequiresOtp(false);
        setOtp("");
        setFileToView(pendingFile.fileUrl);
        setPendingFile(null);
      } else {
        enqueueSnackbar("Invalid OTP. Please try again.", { variant: "error" });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      enqueueSnackbar("An error occurred while verifying OTP.", {
        variant: "error",
      });
    }
  };

  const closeViewer = () => {
    setFileToView(null);
    setExpiryTime(null);
  };

  useEffect(() => {
    if (fileToView && expiryTime) {
      const intervalId = setInterval(() => {
        if (isExpired(expiryTime)) {
          enqueueSnackbar("File has expired.", { variant: "warning" });
          closeViewer();
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [fileToView, expiryTime]);

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
                <div>
                  File Name:{" "}
                  {file.fileName.split("_").slice(1).join("_") || file.fileName}{" "}
                </div>
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
                    onClick={() => handleView(file)}
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

      {requiresOtp && (
        <div className="otp-modal">
          <div className="otp-content">
            <h3>Verify OTP to View File</h3>
            {isLoading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">
                  Sending OTP To Your Email. Please Wait...
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="otp-input"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                />
                <button className="otp-button" onClick={verifyOtp}>
                  Submit
                </button>
                <button
                  className="otp-button cancel"
                  onClick={() => setRequiresOtp(false)}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
