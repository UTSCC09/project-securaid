"use client";

import Link from "next/link";
import "./page.css";

function Credits() {
  return (
    <div className="credits-container">
      <h1>Credits</h1>
      <p>Here are the resources that helped build this project:</p>
      <ul>
        <li>
          <a
            href="https://reactjs.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            React.js Documentation
          </a>
        </li>
        <li>
          <a
            href="https://nextjs.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Documentation
          </a>
        </li>
        <li>
          <a
            href="https://notistack.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Notistack for Notifications
          </a>
        </li>
        <li>
          <a
            href="https://magicui.design/"
            target="_blank"
            rel="noopener noreferrer"
          >
            magicui.design for Globe Visualization
          </a>
        </li>
        <li>
          <a
            href="https://chatgpt.com/share/674b4b56-a2e8-8005-bab7-dc36542f8491"
            target="_blank"
            rel="noopener noreferrer"
          >
            ChatGPT used for Nodemailer's OTP functionality
          </a>
        </li>
        <li>
          <a
            href="https://chatgpt.com/share/674b7f09-82b0-8005-9076-1287cf50e538"
            target="_blank"
            rel="noopener noreferrer"
          >
            ChatGPT used for integrating https with nginx.conf
          </a>
        </li>
      </ul>
      <p>
        <Link href="/">
          <button style={{ padding: "10px 20px", cursor: "pointer" }}>
            Back to Homepage
          </button>
        </Link>
      </p>
    </div>
  );
}

export default Credits;
