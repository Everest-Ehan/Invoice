import React from "react";
export default function Loader({ message = "Loading..." }) {
  return (
    <div className="connect-container">
      <h2>{message}</h2>
      <div>Please wait...</div>
    </div>
  );
}
