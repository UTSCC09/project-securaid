import { useRef, useEffect, useState } from "react";
import "./LoginComponent.css";

export function LoginComponent(props) {
  const { signup, signin, onLogin } = props;
  const [error, setError] = useState("");

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = usernameRef.current.value;
    const password = passwordRef.current.value;
    const clickedButton = e.nativeEvent.submitter.id;

    if (clickedButton === "signin") {
        signin(username, password, (error) => setError(error.message), () => {
          onLogin(username);
          e.target.reset();
        });
      } else if (clickedButton === "signup") {
        signup(username, password, (error) => setError(error.message), () => {
          onLogin(username);
          e.target.reset();
        });
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
      <div className="error"></div>
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
