"use client";
import { useEffect, useState } from "react";
import {
  handleSignin,
  handleSignout,
  handleSignup,
} from "../app/api/login/route.js";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";

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
        <div id="loginComponent">
          <LoginComponent
            signup={handleSignup}
            signin={handleSignin}
            onLogin={setUsername}
          />
        </div>
      )}
    </>
  );
}

export default Page;
