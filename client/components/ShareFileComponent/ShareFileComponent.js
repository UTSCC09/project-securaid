import { useEffect, useState } from "react";
import { IoAddCircleOutline } from "react-icons/io5";
import { MdOutlineAddBox } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";
import "./ShareFileComponent.css";

export function ShareFileComponent({ userId }) {
  const [projects, setProjects] = useState([]);
  const [filesByProject, setFilesByProject] = useState({});
  const [expandedProjects, setExpandedProjects] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [users, setUsers] = useState([]); // State for storing users
  const [selectedUsers, setSelectedUsers] = useState([]); // State for storing users

  // Fetch projects from the backend
  const fetchProjects = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/projects?userId=${userId}`,
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

  // Fetch files for a specific project
  const fetchFiles = async (projectId) => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/files?userId=${userId}&projectId=${projectId}`,
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

  // Automatically fetch files for all projects on load
  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId]);

  useEffect(() => {
    // Fetch files for all projects at once when projects are loaded
    projects.forEach((project) => {
      if (!filesByProject[project._id]) {
        fetchFiles(project._id);
      }
    });
  }, [projects]);

  const toggleProjectExpansion = (projectId) => {
    if (expandedProjects.includes(projectId)) {
      setExpandedProjects((prev) => prev.filter((id) => id !== projectId));
    } else {
      setExpandedProjects((prev) => [...prev, projectId]);
    }
  };

  const fetchUsers = async (searchQuery = "") => {
    try {
      const selectedUsernames = selectedUsers.map((user) => user.username);

      const response = await fetch(
        `http://localhost:4000/api/search-users?query=${searchQuery}&exclude=${JSON.stringify(selectedUsernames)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []); // Update the users list
      } else {
        alert("Failed to fetch users");
        setUsers([]); // Clear users list on failure
      }
    } catch (error) {
      alert("Error fetching users");
      setUsers([]); // Clear users list on error
    }
  };



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
                        const currentFileIds = prev.map((file) => file._id); // Get IDs of already selected files
                        const newFiles = (
                          filesByProject[project._id] || []
                        ).filter((file) => {
                          if (currentFileIds.includes(file._id)) {
                            alert(
                              `File "${file.filename}" is already selected.`
                            );
                            return false; // Skip duplicates
                          }
                          return true; // Add new files
                        });
                        return [...prev, ...newFiles]; // Append only new files
                      })
                    }
                  />
                </div>


                {isExpanded &&
                  (filesByProject[project._id] || []).map((file) => (
                    <div key={file._id} className="file-item-element">
                      <div id="share-project-item">
                        <div
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          {file.filename.split("_").slice(1).join("_") ||
                            file.filename}{" "}
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
          <div>No projects found.</div>
        )}
        {selectedFiles.length > 0 ? (
          <div className="selected-files">
            <div className="files-uploaded-navbar-title">Selected files</div>
            {selectedFiles.map((file, index) => (
              <div className="selected-file-item" key={index}>
                <div className="selected-file">
                  {file.filename.split("_").slice(1).join("_") || file.filename}{" "}
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
        ) : (
          <div></div>
        )}
        {selectedFiles.length > 0 ? (
          <div className="selected-files">
            <div className="files-uploaded-navbar-title">Select Users</div>
            <input
              type="text"
              placeholder="Search users"
              className="upload-input"
              id="upload-input_text"
              onChange={(e) => {
                if(e.target.value === "") {
                  setUsers([]);
                  return;
                }
                else {
                  fetchUsers(e.target.value);
                }
              }}
            />
            <div className="retrieved-users">
              {users.map((user) => ( user.username !== userId &&
                <div key={user._id} className="file-link" onClick={()=>{
                    setSelectedUsers((prev) => {
                        const isDuplicate = prev.some(
                        (selectedUser) => selectedUser._id === user._id
                        );
                        if (!isDuplicate) {
                        return [...prev, user];
                        }
                        return prev;
                    });
                    setUsers((prev)=>{
                        return prev.filter((retrievedUser)=>retrievedUser._id !== user._id);
                    });
                }}>
                  {user.username}
                </div>
              ))}
              {selectedUsers.map((user, index) => (
              <div className="file-item-element" key={index}>
                <div className="file-link">
                  {user.username}
                </div>
                <RiDeleteBin6Line
                  className="file-button"
                  size={30}
                  color="white"
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
        ) : (
          <div></div>
        )}
      </div>
      <button id="share-button" onClick={()=>{}}>Share</button>
    </div>
  );
}
