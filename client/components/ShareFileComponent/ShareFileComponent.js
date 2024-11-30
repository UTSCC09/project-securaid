import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { IoAddCircleOutline } from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import "./ShareFileComponent.css";

export function ShareFileComponent({ userId, refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [filesByProject, setFilesByProject] = useState({});
  const [expandedProjects, setExpandedProjects] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [expiryHours, setExpiryHours] = useState(""); // Expiry time (hours)
  const [expiryMinutes, setExpiryMinutes] = useState(""); // Expiry time (minutes)
  const { enqueueSnackbar } = useSnackbar();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  // Fetch projects associated with the user
  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/api/projects?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      } else {
        console.error("Failed to fetch projects:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Fetch files for a given project
  const fetchFiles = async (projectId) => {
    try {
      const response = await fetch(
        `${backendUrl}/api/files?userId=${userId}&projectId=${projectId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFilesByProject((prev) => ({
          ...prev,
          [projectId]: data.files || [],
        }));
      } else {
        console.error("Failed to fetch files:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/all-users`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users:", await response.json());
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  // Toggle the expansion state of a project
  const toggleProjectExpansion = (projectId) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  // Handle file and user sharing
  const handleShare = async () => {
    if (selectedFiles.length === 0 || selectedUsers.length === 0) {
      enqueueSnackbar(`Please select at least one file and one user.`, {
        variant: "warning",
      });
      return;
    }

    if (!expiryHours || !expiryMinutes) {
      enqueueSnackbar(`Please specify expiry hours and minutes.`, {
        variant: "warning",
      });
      return;
    }

    const successes = [];
    const failures = [];

    try {
      for (const user of selectedUsers) {
        for (const file of selectedFiles) {
          const response = await fetch(`${backendUrl}/api/share-file`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sharedTo: user.username,
              sharedBy: userId,
              fileName: file.filename,
              fileUrl: file.url,
              expiryTime: `${expiryHours}:${expiryMinutes}`,
            }),
          });

          if (response.ok) {
            successes.push(
              `File "${file.filename
                .split("_")
                .slice(1)
                .join("_")} shared with ${user.username}`
            );
          } else {
            const { error } = await response.json();
            failures.push(
              `Failed to share "${file.filename}" with ${user.username}: ${error.message}`
            );
          }
        }
      }

      // Summarize results in a single alert
      if (successes.length > 0) {
        for (const success of successes) {
          enqueueSnackbar(success, { variant: "success" });
        }
      }
      if (failures.length > 0) {
        for (const failure of failures) {
          enqueueSnackbar(failure, { variant: "error" });
        }
      }
    } catch (error) {
      console.error("Error sharing files:", error);
      enqueueSnackbar(
        `An unexpected error occurred while sharing files. Please try again.`,
        { variant: "error" }
      );
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId, refreshTrigger]);

  useEffect(() => {
    projects.forEach((project) => {
      if (!filesByProject[project._id]) {
        fetchFiles(project._id);
      }
    });
  }, [projects]);

  return (
    <div className="files-uploaded-navbar">
      <div className="files-uploaded-navbar-title">Share Files</div>
      <div className="files-uploaded-navbar-content">
        {projects.length > 0 ? (
          projects.map((project) => {
            const isExpanded = expandedProjects.includes(project._id);
            return (
              <div key={project._id} className="project-item">
                <div id="share-project-item">
                  <button
                    className="project-item-button"
                    onClick={() => toggleProjectExpansion(project._id)}
                  >
                    {project.folderName}
                  </button>
                  <MdOutlineAddBox
                    id="add-project-button"
                    onClick={() =>
                      setSelectedFiles((prev) => {
                        const currentFileIds = prev.map((file) => file._id);
                        const newFiles = (
                          filesByProject[project._id] || []
                        ).filter((file) => {
                          if (currentFileIds.includes(file._id)) {
                            enqueueSnackbar(
                              `File "${file.filename}" is already selected.`,
                              { variant: "warning" }
                            );
                            return false;
                          }
                          return true;
                        });
                        return [...prev, ...newFiles];
                      })
                    }
                  />
                </div>

                {isExpanded &&
                  (filesByProject[project._id] || []).map((file) => (
                    <div key={file._id} className="file-item-element">
                      <div id="share-project-item">
                        <div className="selected-file">
                          {file.filename.split("_").slice(1).join("_") ||
                            file.filename}
                        </div>
                        <IoAddCircleOutline
                          id="add-file-button"
                          onClick={() =>
                            setSelectedFiles((prev) => {
                              const isDuplicate = prev.some(
                                (selectedFile) => selectedFile._id === file._id
                              );
                              if (!isDuplicate) {
                                return [...prev, file];
                              }
                              return prev;
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
              </div>
            );
          })
        ) : (
          <div className="no-shared-files">No files to share.</div>
        )}
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <div className="files-uploaded-navbar-title">Selected Files</div>
            {selectedFiles.map((file, index) => (
              <div className="file-item-element" key={index}>
                <div className="selected-file">
                  {file.filename.split("_").slice(1).join("_") || file.filename}
                </div>
                <RiDeleteBin6Line
                  className="file-button"
                  size={30}
                  color="white"
                  onClick={() =>
                    setSelectedFiles((prev) =>
                      prev.filter(
                        (selectedFile) => selectedFile._id !== file._id
                      )
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
        {selectedFiles.length > 0 && (
          <div className="selected-users">
            <div className="files-uploaded-navbar-title">Select Users</div>
            <div className="user-list">
              {users.map(
                (user) =>
                  user.username !== userId && (
                    <div
                      key={user._id}
                      className="user-item"
                      onClick={() => {
                        setSelectedUsers((prev) => {
                          const isDuplicate = prev.some(
                            (selectedUser) => selectedUser._id === user._id
                          );
                          return isDuplicate ? prev : [...prev, user];
                        });
                      }}
                    >
                      {user.username}
                    </div>
                  )
              )}
            </div>
            <div className="selected-users">
              {selectedUsers.map((user, index) => (
                <div className="selected-user" key={index}>
                  {user.username}
                  <RiDeleteBin6Line
                    className="file-button"
                    size={20}
                    onClick={() =>
                      setSelectedUsers((prev) =>
                        prev.filter(
                          (selectedUser) => selectedUser._id !== user._id
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <>
          <div className="expiration-input">
            <label className="limit-parameters">
              Expiry Time (Hours):
              <input
                type="number"
                min="0"
                max="23"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
              />
            </label>
            <label className="limit-parameters">
              Expiry Time (Minutes):
              <input
                type="number"
                min="0"
                max="59"
                value={expiryMinutes}
                onChange={(e) => setExpiryMinutes(e.target.value)}
              />
            </label>
          </div>
          <button id="share-button" onClick={handleShare}>
            Share
          </button>
        </>
      )}
    </div>
  );
}
