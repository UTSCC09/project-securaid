import { useSnackbar } from "notistack";
import { useEffect, useRef, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import "./LoginComponent.css";

export function LoginComponent(props) {
  const { signup, signin, onLogin, isGoogleUsed } = props;
  const [isSignUp, setIsSignUp] = useState(false);
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const usernameOrEmailRef = useRef(null);
  const passwordRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const signUpPasswordRef = useRef(null);

  const handleGoogleSignIn = (e) => {
    e.preventDefault(); // Prevent default form submission
    isGoogleUsed(true); // Indicate Google sign-in
    setIsGoogleSignIn(true); // Indicate Google sign-in
    window.location.href = `https://securaid-backend.mywire.org/auth/google`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get("username");

    if (username) {
      onLogin(username);
      enqueueSnackbar("Logged in successfully with Google!", {
        variant: "success",
      });

      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [onLogin, enqueueSnackbar]);

  const extractErrorMessage = (error) => {
    try {
      const parsedError = JSON.parse(error.message.split("(status:")[0].trim());
      return parsedError.message || "An error occurred.";
    } catch {
      return error.message?.split("(status:")[0].trim() || "An error occurred.";
    }
  };

  const handleSignIn = (e) => {
    e.preventDefault();
    if (isGoogleSignIn) return;

    const usernameOrEmail = usernameOrEmailRef.current.value;
    const password = passwordRef.current.value;

    signin(
      usernameOrEmail,
      password,
      (error) =>
        enqueueSnackbar(extractErrorMessage(error), { variant: "error" }),
      (username) => {
        onLogin(username);
        enqueueSnackbar("Logged in successfully!", { variant: "success" });
        e.target.reset();
      }
    );
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    if (isGoogleSignIn) return; // Skip validation if Google sign-in is triggered

    const username = usernameRef.current.value;
    const email = emailRef.current.value;
    const password = signUpPasswordRef.current.value;

    signup(
      username,
      password,
      email,
      (error) =>
        enqueueSnackbar(extractErrorMessage(error), { variant: "error" }),
      (data) => {
        enqueueSnackbar(data.message, { variant: "success" });
        e.target.reset();
        setIsSignUp(false);
      }
    );
  };

  return (
    <div className="complex-form-wrapper">
      {isSignUp ? (
        <form className="complex-form" onSubmit={handleSignUp}>
          <div className="form-title">Sign Up</div>
          <input
            type="text"
            id="form-username"
            className="form-element"
            placeholder="Enter your username"
            name="username"
            required={!isGoogleSignIn} // Required only if not using Google sign-in
            ref={usernameRef}
          />
          <input
            type="email"
            id="form-email"
            className="form-element"
            placeholder="Enter your email"
            name="email"
            required={!isGoogleSignIn} // Required only if not using Google sign-in
            ref={emailRef}
          />
          <input
            type="password"
            id="form-password"
            className="form-element"
            placeholder="Enter your password"
            name="password"
            required={!isGoogleSignIn} // Required only if not using Google sign-in
            ref={signUpPasswordRef}
          />
          <div id="auth-buttons_signup">
            <button type="submit" className="auth-button">
              Sign Up
            </button>
            <div>Or</div>
            <button onClick={handleGoogleSignIn} className="auth-button-google">
              Sign Up with Google <FcGoogle />
            </button>
            <div>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-button-secondary"
                onClick={() => setIsSignUp(false)}
              >
                Log In
              </button>
            </div>
          </div>
        </form>
      ) : (
        <form className="complex-form" onSubmit={handleSignIn}>
          <div className="form-title">Sign In</div>
          <input
            type="text"
            id="form-username-email"
            className="form-element"
            placeholder="Enter your username or email"
            name="usernameOrEmail"
            required={!isGoogleSignIn} // Required only if not using Google sign-in
            ref={usernameOrEmailRef}
          />
          <input
            type="password"
            id="form-password"
            className="form-element"
            placeholder="Enter your password"
            name="password"
            required={!isGoogleSignIn} // Required only if not using Google sign-in
            ref={passwordRef}
          />
          <div id="auth-buttons_signin">
            <button type="submit" className="auth-button">
              Sign In
            </button>
            <div>Or</div>
            <button onClick={handleGoogleSignIn} className="auth-button-google">
              Log In with Google <FcGoogle />
            </button>
            <div>
              New here?{" "}
              <button
                type="button"
                className="auth-button-secondary"
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
