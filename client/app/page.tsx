"use client";
import { useEffect, useState } from "react";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";

function Page() {
  // Create a state for username
  const [username, setUsername] = useState<string | null>(null);

  // Check if the user is already logged in on mount
  useEffect(() => {
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
      }
    }
    fetchUsername();
  }, []);

  // Sign in function that calls the API
  const handleSignin = async (username: string, password: string) => {
    try {
      console.log("Signing in with", username)
      const response = await fetch("http://localhost:4000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username); // Assume API returns the username
      }
    } catch (error) {
    }
  };

  const handleSignup = async (username: string, password: string) => {
    try {
      const response = await fetch("http://localhost:4000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.userId ? username : ""); // Assuming successful response contains `userId`
        console.log("Sign-up successful:", data);
      } else {
        console.error("Sign-up failed:", await response.text());
      }
    } catch (error) {
      console.error("Sign-up error:", error);
    }
  };

  // Sign out function
  const handleSignOut = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setUsername(null);
        console.log("Sign-out successful");
      }
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <>
      <h1 id="homepage_title">Securaid</h1>
      <h4 id="homepage_slogan">A secure place for everyone</h4>

      {username ? (
        // Show ContentComponent and sign-out button when logged in
        <>
          <div id="auth-buttons">
            <button className="auth-button" id="signout" onClick={handleSignOut}>
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
