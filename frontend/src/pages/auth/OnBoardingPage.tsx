// src/pages/LandingPage.tsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";

const OnBoardingPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleContinueAsGuest = () => {
    navigate("/home");
  };

  return (
    <div className="d-flex align-center justify-center" style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="row justify-center">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            <div className="text-center p-4">
              {/* Logo/Brand Section */}
              <div className="mb-4">
                <h1 className="mb-2">SurVace</h1>
              </div>

              {/* Action Buttons */}
              <div className="mb-4">
                {/* Email/Phone Login */}
                <Link 
                  to="/login" 
                  className="btn btn-black d-block w-100 mb-3 p-3 text-center"
                >
                  Login
                </Link>

                {/* Register Link */}
                <Link 
                  to="/register" 
                  className="btn btn-white d-block w-100 mb-3 p-3 text-center"
                >
                  Register
                </Link>
              </div>

              {/* Continue as Guest */}
              <button 
                onClick={handleContinueAsGuest}
                className="btn-link text-center"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnBoardingPage;