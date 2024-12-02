"use client";
import Link from "next/link";
import { SnackbarProvider } from "notistack";
import { useEffect, useState } from "react";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { Globe } from "../components/Globe/Globe";
import { HyperText } from "../components/HyperText/HyperText";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";

import {
  handleSignin,
  handleSignout,
  handleSignup,
} from "../src/utils/route.js";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
function Page() {
  const [username, setUsername] = useState<string | null>(null);
  const [isGoogleUsed, setIsGoogleUsed] = useState(false);

  useEffect(() => {
    async function fetchUsername() {
      fetch("https://securaid-backend.mywire.org/api/session", {
        method: "GET",
        credentials: "include", // Include cookies in the request
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("No valid session.");
          }
          return response.json(); // Parse the JSON response
        })
        .then((data) => {
          const { username } = data;
          console.log(`Welcome back, ${username}!`);
          // Update the UI with the logged-in user's info
        })
        .catch((error) => {
          console.error("No valid session:", error.message);
        });
    }
    fetchUsername();
  }, []);

  return (
    <SnackbarProvider maxSnack={5} autoHideDuration={2500}>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
                onClick={() =>
                  handleSignout(() => setUsername(null), isGoogleUsed)
                }
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
                isGoogleUsed={setIsGoogleUsed}
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
      <div style={{ marginTop: "440px" }}>
        <Link href="/credits">
          <button style={{ padding: "10px 20px", cursor: "pointer" }}>
            Credits
          </button>
        </Link>
      </div>
    </SnackbarProvider>
  );
}

export default Page;
