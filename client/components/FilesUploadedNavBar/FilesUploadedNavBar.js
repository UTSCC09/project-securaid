import { useEffect, useState } from "react";
import "./FilesUploadedNavBar.css";

export function FilesUploadedNavBar({ userId, refreshTrigger }) {
  const [projects, setProjects] = useState([]);
  const [filesByProject, setFilesByProject] = useState({});
  const [expandedProjects, setExpandedProjects] = useState([]);

  // Fetch projects from the backend
  const fetchProjects = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/projects?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched projects:", data.projects);
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
        console.log(`Fetched files for project ${projectId}:`, data.files);

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

  // Toggle project expansion with fetch if not already expanded
  const toggleProjectExpansion = (projectId) => {
    if (expandedProjects.includes(projectId)) {
      setExpandedProjects((prev) => prev.filter((id) => id !== projectId));
    } else {
      setExpandedProjects((prev) => [...prev, projectId]);
      if (!filesByProject[projectId]) {
        fetchFiles(projectId);
      }
    }
  };

  useEffect(() => {
    if (userId) {
      fetchProjects();
    }
  }, [userId, refreshTrigger]);

  return (
    <div className="files-uploaded-navbar">
      <div className="files-uploaded-navbar-title">Projects</div>
      <div className="files-uploaded-navbar-content">
        {projects.length > 0 ? (
          projects.map((project) => {
            if (typeof project.folderName !== "string") {
              console.error("Invalid project folderName:", project);
              return null;
            }

            const isExpanded = expandedProjects.includes(project._id);

            return (
              <div key={project._id} className="project-item">
                <button
                  className="project-item-button"
                  onClick={() => toggleProjectExpansion(project._id)}
                >
                  {project.folderName}
                </button>
                <div
                  className={`file-container ${
                    isExpanded ? "expanded" : "collapsed"
                  }`}
                >
                  {isExpanded &&
                    (filesByProject[project._id] && filesByProject[project._id].length > 0 ? (
                      filesByProject[project._id].map((file) => (
                        <a
                          key={file._id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="file-link"
                        >
                          {file.filename.split("_").slice(1).join("_") || file.filename}{" "}
                        </a>
                      ))
                    ) : (
                      <div className="no-files">No files found.</div>
                    ))}
                </div>
              </div>
            );
          })
        ) : (
          <div>No projects found.</div>
        )}
      </div>
    </div>
  );
}
