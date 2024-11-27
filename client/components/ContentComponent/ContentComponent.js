import { useState } from "react";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { ShareFileComponent } from "../ShareFileComponent/ShareFileComponent";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";

import "./ContentComponent.css";

export function ContentComponent({ username }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = ({
    uploadedFiles: newFiles,
    scanResults: newResults,
  }) => {
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setScanResults(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewResults = (results) => {
    setScanResults(results);
  };

  return (
    <>
      <UploadContentComponent
        userId={username}
        onUploadSuccess={handleUploadSuccess}
      />
      <div id="content_container">
        <div id="vertical-split">
          <FilesUploadedNavBar
            userId={username}
            refreshTrigger={refreshTrigger}
            onViewResults={handleViewResults}

          />
          <ShareFileComponent
            userId={username}
            refreshTrigger={refreshTrigger}
          />
        </div>
        <DashboardComponent scanResults={scanResults} />
      </div>

    </>
  );
}
