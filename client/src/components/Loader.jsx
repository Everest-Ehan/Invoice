import React from "react";
import "./Loader.css";

export default function Loader({ message = "Loading...", subMessage = "Please wait while we process your request" }) {
  return (
    <div className="loader-container">
      <div className="loader-content">
        {/* Animated logo/brand */}
        <div className="loader-brand">
          <div className="loader-icon">
            <div className="loader-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
          </div>
          <h2 className="loader-title">QuickBooks Invoice Assistant</h2>
        </div>
        
        {/* Main message */}
        <div className="loader-message">
          <h3>{message}</h3>
          <p>{subMessage}</p>
        </div>
        
        {/* Progress indicator */}
        <div className="loader-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
        
        {/* Subtle background animation */}
        <div className="loader-bg-animation">
          <div className="bg-circle"></div>
          <div className="bg-circle"></div>
          <div className="bg-circle"></div>
        </div>
      </div>
    </div>
  );
}
