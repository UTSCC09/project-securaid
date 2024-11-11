"use client";
import { useEffect, useState } from "react";
import { ContentComponent } from "../components/ContentComponent/ContentComponent";
import { LoginComponent } from "../components/LoginComponent/LoginComponent";
import { getUsername, signin, signup } from "./api/login/route.js";
function page() {

  //Create a state of username
  const [username, setUsername] = useState<string | null>(null);

  //Check if the user is already logged in on mount
  useEffect(() => {
    const existingUsername = getUsername();
    if (existingUsername) {
      setUsername(existingUsername);
    }
  }, []);

//Sign out of application
  const handleSignOut = () => {
    document.cookie = "";
    setUsername(null);
  };
  //test code for initial setup (dev)
  return(
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
          <LoginComponent signup={signup} signin={signin} onLogin={setUsername}/>
        </div>
      </div>
      <div id="container">
        <ContentComponent />
      </div>
    </>
  );

//Actual code to be rendered (prod)
  // return username ? (
  //   <>
  //     <div id="login_container">
  //       <div id="auth-buttons">
  //         <button className="auth-button" id="signout" onClick={handleSignOut}>
  //           Sign Out
  //         </button>
  //       </div>
  //       <h1 id="homepage_title">Securaid</h1>
  //       <h4 id="homepage_slogan">A secure place for everyone</h4>
  //     </div>
  //     <div id="container">
  //       <ContentComponent />
  //     </div>
  //   </>
  // ) : (
  //   <>
  //     <div id="login_container">
  //       <h1 id="homepage_title">Securaid</h1>
  //       <h4 id="homepage_slogan">A secure place for everyone</h4>
  //       <div id="loginComponent">
  //         <LoginComponent signup={signup} signin={signin} onLogin={setUsername}/>
  //       </div>
  //     </div>
  //   </>
  // );
}

export default page;
