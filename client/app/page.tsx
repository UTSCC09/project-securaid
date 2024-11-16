"use client";
import { useEffect, useState } from "react";
import { handleSignin, handleSignout, handleSignup } from "../src/utils/route.js";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";
import { Globe } from "../components/Globe/Globe"; // Import the Globe component here

function Page() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsername() {
      try {
        const response = await fetch("http://localhost:4000/api/protected", {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }
    fetchUsername();
  }, []);

  return (
    <>
      <div style={{ position: "relative" }}>
        <h1 id="homepage_title">Securaid</h1>
        <h4 id="homepage_slogan">A secure place for everyone</h4>

        {username ? (
          <>
            <div id="signed-in-bar">
              <span id="welcome-message">@{username}</span>
              <button
                className="sign-out-button"
                id="sign-out-button"
                onClick={() => handleSignout(() => setUsername(null))}
              >
                Sign Out
              </button>
            </div>
            <div id="container">
              <ContentComponent />
            </div>
          </>
        ) : (
          <>
            <div id="loginComponent">
              <LoginComponent
                signup={handleSignup}
                signin={handleSignin}
                onLogin={setUsername}
              />
            </div>

            {/* Show Globe below the Login component */}
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 20px)", // Position the globe below the login component
                left: 0,
                width: "100%",
                height: "400px",
                zIndex: -1,  // Keep the globe in the background
              }}
            >
              <Globe className="globe" />
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Page;
