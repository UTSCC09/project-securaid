"use client";
import { useEffect, useState } from "react";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { Globe } from "../components/Globe/Globe";
import { HyperText } from "../components/HyperText/HyperText";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";
import { SnackbarProvider } from "notistack";
import {
  handleSignin,
  handleSignout,
  handleSignup,
} from "../src/utils/route.js";

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
          setUsername(data.username); // Set username from backend response
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }
    fetchUsername();
  }, []);

  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={3000}>

    <div style={{ position: "relative" }}>
      <h1 id="homepage_title">Securaid</h1>
      <h4 id="homepage_slogan">A secure place for everyone</h4>

      {username ? (
        <>
          <div id="signed-in-bar">
            <div id="welcome-message">
              <HyperText
                text={`Welcome ${username}`}
                duration={2000}
                className="text-6xl font-semibold text-orange"
                animateOnLoad={true}
              />
            </div>
            <button
              className="sign-out-button"
              id="sign-out-button"
              onClick={() => handleSignout(() => setUsername(null))}
            >
              Sign Out
            </button>
          </div>
          <div id="container">
            {/* Pass username to ContentComponent */}
            <ContentComponent username={username} />
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
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 20px)",
              left: 0,
              width: "100%",
              height: "400px",
              zIndex: -1,
            }}
          >
            <Globe className="globe" />
          </div>
        </>
      )}
    </div>
    </SnackbarProvider>
  );
}

export default Page;
