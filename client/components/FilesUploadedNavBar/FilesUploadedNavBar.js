import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { SharedFilesComponent } from "../SharedFilesComponent/SharedFilesComponent";
import "./FilesUploadedNavBar.css";

export function FilesUploadedNavBar({
  userId,
  refreshTrigger,
  onViewResults,
  handleRefresh,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [projects, setProjects] = useState([]);
  const [filesByProject, setFilesByProject] = useState({});
  const [expandedProjects, setExpandedProjects] = useState([]);

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

  // Delete a file
  const handleFileDelete = async (fileId, projectId) => {
    console.log("Deleting file with ID:", fileId);

    try {
      const response = await fetch(
        `http://localhost:4000/api/files/${fileId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const { deleteProject } = await response.json();

        if (deleteProject) {
          // Delete the project if no files remain
          const projectResponse = await fetch(
            `http://localhost:4000/api/projects/${projectId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (projectResponse.ok) {
            enqueueSnackbar(
              `All files in project deleted successfully.`,
              { variant: "success" }
            );
            enqueueSnackbar(
              `No files remaining in project. Project deleted.`,
              { variant: "success" }
            );
            fetchProjects(); // Refresh the list of projects
          } else {
            enqueueSnackbar(
              `Error deleting project.`,
              { variant: "error" }
            );
          }
        } else {
          // Project still exists, refresh its files
          await fetchFiles(projectId);
          enqueueSnackbar(
            `File delete successfully!`,
            { variant: "success" }
          );
        }
      } else {
        enqueueSnackbar(
          `Error deleting file.`,
          { variant: "error" }
        );
      }
    } catch (error) {
      console.error("Error during file deletion:", error);
      enqueueSnackbar(
        `An error occurred during file deletion.`,
        { variant: "error" }
      );
    }
  };

  // View scan results
  const handleViewResults = async (scanId) => {
    try {
      const response = await fetch(`/api/virustotal-results?scanId=${scanId}`);
      if (response.ok) {
        const result = await response.json();
        onViewResults(result); // Pass results to parent component
      } else {
        console.error("Failed to fetch scan results");
      }
    } catch (error) {
      console.error("Error fetching scan results:", error);
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
    fetchFiles(projectId);
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
            const isExpanded = expandedProjects.includes(project._id);
            return (
              <div key={project._id} className="project-item">
                <button
                  className="project-item-button"
                  onClick={() => toggleProjectExpansion(project._id)}
                >
                  {project.folderName}
                </button>
                {isExpanded &&
                  (filesByProject[project._id] || []).map((file) => (
                    <div key={file._id} className="file-item-element">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        {file.filename.split("_").slice(1).join("_") ||
                          file.filename}{" "}
                      </a>
                      <HiOutlineDocumentReport
                        className="file-button"
                        size={30}
                        color="white"
                        onClick={() => handleViewResults(file.scanId)}
                      />
                      <RiDeleteBin6Line
                        className="file-button"
                        size={30}
                        color="white"
                        onClick={() => handleFileDelete(file._id, project._id)}
                      />
                    </div>
                  ))}
              </div>
            );
          })
        ) : (
          <div className="no-shared-files">No projects.</div>
        )}
      </div>
      <SharedFilesComponent username={userId} />
    </div>
  );
}
