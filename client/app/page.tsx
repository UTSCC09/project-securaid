"use client";
import { useEffect, useState } from "react";
import {
  getUsername,
  handleSignin,
  handleSignout,
  handleSignup,
} from "../app/api/login/route.js";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";

function Page() {
  // Create a state for username
  const [username, setUsername] = useState<string | null>(null);

  // Check if the user is already logged in on mount
  useEffect(() => {
    const currentUsername = getUsername();
    if (currentUsername) {
      setUsername(currentUsername);
    } else {
      async function fetchUsername() {
        try {
          const response = await fetch("http://localhost:4000/api/protected", {
            method: "GET",
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setUsername(data.username); // Assuming API returns the username if logged in
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
      fetchUsername();
    }
  }, []);



  return (
    <>
      <h1 id="homepage_title">Securaid</h1>
      <h4 id="homepage_slogan">A secure place for everyone</h4>

      {username ? (
        // Show ContentComponent and sign-out button when logged in
        <>
          <div id="auth-buttons">
          <button className="auth-button" id="signout" onClick={() => handleSignout(() => setUsername(null))}>
    Sign Out
</button>
          </div>
          <div id="container">
            <ContentComponent />
          </div>
        </>
      ) : (
        // Show LoginComponent when not logged in
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
