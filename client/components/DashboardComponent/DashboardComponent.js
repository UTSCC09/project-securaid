import { useEffect, useState } from "react";
import { HyperText } from "../HyperText/HyperText";
import "./DashboardComponent.css";
import { MdPlaylistAdd } from "react-icons/md";

export function DashboardComponent({ scanResults }) {
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [safetyScore, setSafetyScore] = useState(null);

  useEffect(() => {
    if (scanResults) {
      displayAnalysisInfo(scanResults);
    }
  }, [scanResults]);

  function displayAnalysisInfo(response) {
    if (!response || !response.data) {
      console.error("Invalid response:", response);
      return;
    }

    const data = response.data;
    const stats = data.attributes.stats;
    const results = data.attributes.results;
    //console.log("Analysis Data:", data);
    setAnalysisInfo(data);
    // Calculate the safety score using stats
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const failure = stats.failure || 0;
    const confirmedTimeout = stats["confirmed-timeout"] || 0; // Handle properties with hyphens
    const timeout = stats.timeout || 0;
    const harmless = stats.harmless || 0;
    const undetected = stats.undetected || 0;

    const safetyScore =
      10 * malicious +
      5 * suspicious +
      3 * failure +
      2 * confirmedTimeout +
      1 * timeout -
      10 * harmless -
      2 * undetected;

    // Set the calculated safety score
    setSafetyScore(safetyScore);
    //console.log("Safety Score:", safetyScore);
  }

  return (
    <div className="dashboard_container">
      <div className="title">Dashboard</div>
      <div className="content">
        {analysisInfo ? (
          <>
            <div className="scan_results">
              <HyperText
                text={`Scan Results`}
                duration={50}
                className="text-2xl font-semibold text-white"
                animateOnLoad={true}
              />
              <div className="analysis_info_container">
                <div className="billboard-horizontal">
                  <div className="billboard-title">ID: {analysisInfo.id}</div>
                </div>
                <div className="billboard-horizontal">
                  <div className="billboard-title">
                    Status: {analysisInfo.attributes.status}
                  </div>
                </div>
              </div>
            </div>
            {analysisInfo.attributes.status === "completed" && (
              <div className="scan_results">
                <HyperText
                  text={"Vulnerability"}
                  duration={50}
                  className="text-2xl font-semibold text-white"
                  animateOnLoad={true}
                />
                <div className="analysis_info_container">
                  {safetyScore > 0 && safetyScore < 10 && (
                    <div
                      className="billboard"
                      style={{
                        backgroundColor:
                          safetyScore >= 20
                            ? "darkred"
                            : safetyScore >= 10
                            ? "orange"
                            : safetyScore > 0
                            ? "yellow"
                            : "green",
                      }}
                    >
                      <HyperText
                        text={"Relatively Safe"}
                        duration={500}
                        className="text-1xl font-semibold text-white"
                        animateOnLoad={true}
                      />
                    </div>
                  )}
                  {safetyScore >= 10 && safetyScore < 20 && (
                    <div
                      className="billboard"
                      style={{
                        backgroundColor:
                          safetyScore >= 20
                            ? "darkred"
                            : safetyScore >= 10
                            ? "orange"
                            : safetyScore > 0
                            ? "yellow"
                            : "green",
                      }}
                    >
                      <HyperText
                        text={"Not Safe"}
                        duration={500}
                        className="text-1xl font-semibold text-white"
                        animateOnLoad={true}
                      />
                    </div>
                  )}
                  {safetyScore >= 20 && (
                    <div
                      className="billboard"
                      style={{
                        backgroundColor:
                          safetyScore >= 20
                            ? "darkred"
                            : safetyScore >= 10
                            ? "orange"
                            : safetyScore > 0
                            ? "yellow"
                            : "green",
                      }}
                    >
                      <HyperText
                        text={"Malware Detected"}
                        duration={500}
                        className="text-1xl font-semibold text-white"
                        animateOnLoad={true}
                      />
                    </div>
                  )}
                  {safetyScore <= 0 && (
                    <div
                      className="billboard"
                      style={{
                        backgroundColor:
                          safetyScore >= 20
                            ? "darkred"
                            : safetyScore >= 10
                            ? "orange"
                            : safetyScore > 0
                            ? "yellow"
                            : "green",
                      }}
                    >
                      <HyperText
                        text={"Safe"}
                        duration={500}
                        className="text-1xl font-semibold text-white"
                        animateOnLoad={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {analysisInfo.attributes.status === "completed" && (
              <div className="scan_results">
                <HyperText
                  text={`Statitics`}
                  duration={250}
                  className="text-2xl font-semibold text-white"
                  animateOnLoad={true}
                />
                <div className="stats-info">
                  {analysisInfo &&
                    Object.entries(analysisInfo.attributes.stats).map(
                      ([key, value]) => (
                        <div className="billboard" key={`stats-${key}`}>
                          <HyperText
                            text={`${key}: ${value}`}
                            duration={500}
                            className="text-1xl font-semibold text-white"
                            animateOnLoad={true}
                          />
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
            {analysisInfo.attributes.status === "completed" && (
              <div className="scan_results">
                <HyperText
                  text={`Engine Results`}
                  duration={250}
                  className="text-2xl font-semibold text-white"
                  animateOnLoad={true}
                />
                <div className="stats-info">
                  {analysisInfo &&
                    Object.entries(analysisInfo.attributes.results).map(
                      ([engine, value]) => (
                        <div className="billboard" key={`result-${engine}`}>
                          <HyperText
                            text={engine}
                            duration={500}
                            className="text-2xl font-semibold text-white"
                            animateOnLoad={true}
                          />
                          <div className="engine_container">
                            <div className="engine-info">
                              Method: {value.method}
                            </div>
                            <div className="engine-info">
                              Version: {value.engine_version}
                            </div>
                            <div className="engine-info">
                              Category: {value.category}
                            </div>
                            {value.result && (
                              <div className="engine-info">
                                Result: {value.result}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-shared-files" style={{ textAlign: "left" }}>
            Add a project first.
          </div>
        )}
      </div>
    </div>
  );
}
