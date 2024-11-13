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
        const response = await fetch("/api/login", { method: "GET" });
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

  // Sign in function that calls the API
  const handleSignin = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, action: "signin" }),
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username); // Assume API returns the username
      }
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  // Sign up function that calls the API
  const handleSignup = async (username: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, action: "signup" }),
      });
      if (response.ok) {
        const data = await response.json();
        setUsername(data.username); // Assume API returns the username
      }
    } catch (error) {
      console.error("Sign-up error:", error);
    }
  };

  // Sign out function
  const handleSignOut = () => {
    document.cookie = ""; // Clear the cookie
    setUsername(null);
  };

  return (
    <>
      <div id="login_container">
        <div id="auth-buttons">
          <button className="auth-button" id="signout" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
        <h1 id="homepage_title">Securaid</h1>
        <h4 id="homepage_slogan">A secure place for everyone</h4>
        <div id="loginComponent">
          <LoginComponent
            signup={handleSignup}
            signin={handleSignin}
            onLogin={setUsername}
          />
        </div>
      </div>
      <div id="container">
        <ContentComponent />
      </div>
    </>
  );
}

export default Page;
