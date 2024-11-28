import { useState, useRef } from "react";
import "./LoginComponent.css";

export function LoginComponent(props) {
  const { signup, signin, onLogin } = props;
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const usernameOrEmailRef = useRef(null);
  const passwordRef = useRef(null);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const signUpPasswordRef = useRef(null);

  const handleSignIn = (e) => {
    e.preventDefault();
    const usernameOrEmail = usernameOrEmailRef.current.value;
    const password = passwordRef.current.value;

    signin(
      usernameOrEmail,
      password,
      (error) => setError(error.message),
      (username) => {
        onLogin(username);
        setError("");
        setSuccessMessage("Logged in successfully.");
        e.target.reset();
      }
    );
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    const username = usernameRef.current.value;
    const email = emailRef.current.value;
    const password = signUpPasswordRef.current.value;

    signup(
      username,
      password,
      email,
      (error) => setError(error.message),
      (data) => {
        setError("");
        setSuccessMessage(data.message);
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
            required
            ref={usernameRef}
          />
          <input
            type="email"
            id="form-email"
            className="form-element"
            placeholder="Enter your email"
            name="email"
            required
            ref={emailRef}
          />
          <input
            type="password"
            id="form-password"
            className="form-element"
            placeholder="Enter your password"
            name="password"
            required
            ref={signUpPasswordRef}
          />
          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}
          <div id="auth-buttons_signup">
            <button type="submit" className="auth-button">
              Sign Up
            </button>
            <button
              type="button"
              className="auth-button-secondary"
              onClick={() => setIsSignUp(false)}
            >
              Go to Login
            </button>
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
            required
            ref={usernameOrEmailRef}
          />
          <input
            type="password"
            id="form-password"
            className="form-element"
            placeholder="Enter your password"
            name="password"
            required
            ref={passwordRef}
          />
          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}
          <div id="auth-buttons_signin">
            <button type="submit" className="auth-button">
              Sign In
            </button>
            <button
              type="button"
              className="auth-button-secondary"
              onClick={() => setIsSignUp(true)}
            >
              Go to Sign Up
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
