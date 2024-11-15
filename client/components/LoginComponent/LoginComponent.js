import { useRef, useState } from "react";
import "./LoginComponent.css";

export function LoginComponent(props) {
  const { signup, signin, onLogin } = props;
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = usernameRef.current.value;
    const password = passwordRef.current.value;
    const clickedButton = e.nativeEvent.submitter.id;

    if (clickedButton === "signin") {
      setError(""); // Clear error when attempting to log in
      setSuccessMessage(""); // Clear success message when attempting to log in
      signin(
        username,
        password,
        (error) => setError(error.message),
        () => {
          onLogin(username);
          e.target.reset();
        }
      );
    } else if (clickedButton === "signup") {
      setError(""); // Clear error when attempting to sign up
      setSuccessMessage(""); // Clear success message when attempting to sign up
      signup(
        username,
        password,
        (error) => {
          setError(error.message);
          setSuccessMessage(""); // Clear success message if there's an error
        },
        (data) => {
          setError(""); // Clear error if sign-up is successful
          setSuccessMessage(data.message); // Show success message
          e.target.reset();
        }
      );
    }
  };

  return (
    <form className="complex-form" onSubmit={handleSubmit}>
      <div className="form-title">Login</div>
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
      <div id="auth-buttons_login">
        <button type="submit" className="auth-button" id="signin">
          Login
        </button>
        <button type="submit" className="auth-button" id="signup">
          Sign Up
        </button>
      </div>
    </form>
  );
}
