import { useEffect, useState } from "react";
import { HyperText } from "../HyperText/HyperText";
import "./DashboardComponent.css";

export function DashboardComponent({ scanResults }) {
  const [analysisInfo, setAnalysisInfo] = useState(null);

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
    console.log("Analysis Data:", data);
    setAnalysisInfo(data);
    // Display basic analysis information
    console.log("Analysis ID:", data.id);
    console.log("Analysis Type:", data.type);
    console.log("Analysis Status:", data.attributes.status);
    console.log("Self Link:", data.links.self);
    console.log("Item Link:", data.links.item);

    // Display stats
    console.log("\n=== Statistics ===");
    for (const [key, value] of Object.entries(stats)) {
      console.log(`${key}: ${value}`);
    }

    // Display engine-specific results
    console.log("\n=== Engine Results ===");
    for (const engine in results) {
      const result = results[engine];
      console.log(`Engine: ${engine}`);
      console.log(`  Method: ${result.method}`);
      console.log(`  Engine Name: ${result.engine_name}`);
      console.log(`  Engine Version: ${result.engine_version}`);
      console.log(`  Engine Update: ${result.engine_update}`);
      console.log(`  Category: ${result.category}`);
      console.log(`  Result: ${result.result}`);
      console.log("--------------------------------");
    }
  }

  return (
    <div className="dashboard_container">
      <div className="title">Dashboard</div>
      <div className="content">
        {analysisInfo && (
          <>
            <div className="scan_results">
              <HyperText
                text={`Scan Results`}
                duration={50}
                className="text-2xl font-semibold text-white"
                animateOnLoad={true}
              />
              <div className="analysis_info_container">
                <div className="billboard">
                  <HyperText
                    text={"ID: " + analysisInfo.id}
                    duration={500}
                    className="text-1xl font-semibold text-white"
                    animateOnLoad={true}
                  />
                </div>
                <div className="billboard">
                  <HyperText
                    text={"Status: " + analysisInfo.attributes.status}
                    duration={500}
                    className="text-1xl font-semibold text-white"
                    animateOnLoad={true}
                  />
                </div>
                <div className="billboard-link">
                    <a href={analysisInfo.links.self}>Report Link</a>
                </div>
              </div>
            </div>

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
                      <div className="billboard">
                        <HyperText
                          key={key}
                          text={key + ": " + value}
                          duration={500}
                          className="text-1xl font-semibold text-white"
                          animateOnLoad={true}
                        />
                      </div>
                    )
                  )}
              </div>
            </div>
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
                      <div className="billboard">
                        <HyperText
                          key={engine}
                          text={engine}
                          duration={500}
                          className="text-2xl font-semibold text-white"
                          animateOnLoad={true}
                        />
                        <div className="engine_container">

                        <div className="engine-info">Method: {value.method}</div>
                        <div className="engine-info">Version: {value.engine_version}</div>
                        <div className="engine-info">Category: {value.category}</div>
                        {value.result && <div className="engine-info">Result: {value.result}</div>}
                        </div>
                      </div>
                    )
                  )}
              </div>
            </div>
            <div className="scan_results">
              <HyperText
                text={`Vulnerability Score`}
                duration={50}
                className="text-2xl font-semibold text-white"
                animateOnLoad={true}
              />
              <div className="analysis_info_container">
                <div className="billboard">
                  <HyperText
                    text={"ID: " + analysisInfo.id}
                    duration={500}
                    className="text-1xl font-semibold text-white"
                    animateOnLoad={true}
                  />
                </div>
                <div className="billboard">
                  <HyperText
                    text={"Status: " + analysisInfo.attributes.status}
                    duration={500}
                    className="text-1xl font-semibold text-white"
                    animateOnLoad={true}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// Analysis ID: f-c259d609e97f0a5cadf17b3822935cbcc85e8c272b2a04afef6baba75948a5d3-1732216623
// DashboardComponent.js:27 Analysis Type: analysis
// DashboardComponent.js:28 Analysis Status: completed
// DashboardComponent.js:29 Self Link: https://www.virustotal.com/api/v3/analyses/f-c259d609e97f0a5cadf17b3822935cbcc85e8c272b2a04afef6baba75948a5d3-1732216623
// DashboardComponent.js:30 Item Link: https://www.virustotal.com/api/v3/files/c259d609e97f0a5cadf17b3822935cbcc85e8c272b2a04afef6baba75948a5d3
// DashboardComponent.js:33
// === Statistics ===
// DashboardComponent.js:35 malicious: 0
// DashboardComponent.js:35 suspicious: 0
// DashboardComponent.js:35 undetected: 62
// DashboardComponent.js:35 harmless: 0
// DashboardComponent.js:35 timeout: 0
// DashboardComponent.js:35 confirmed-timeout: 0
// DashboardComponent.js:35 failure: 1
// DashboardComponent.js:35 type-unsupported: 13
// DashboardComponent.js:39
