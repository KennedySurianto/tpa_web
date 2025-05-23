// src/pages/LandingPage.tsx

import React from "react";
import { Link } from "react-router-dom";

const LandingPage: React.FC = () => {
  return (
    <div>
      <h1>Welcome to TokTik</h1>
      <p>A simple TikTok clone. Watch and share short videos.</p>
      <div>
        <Link to="/login">Login</Link>
        <br />
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
};

export default LandingPage;
