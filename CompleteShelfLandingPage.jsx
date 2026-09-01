import React, { useEffect } from "react";
import { RESTAURANT_INFO } from "./menu-data.js";

/**
 * RestaurantMenuLandingPage React Component
 * 
 * Luxury Editorial Restaurant Menu Component matching the reference menu design.
 * 
 * @param {Object} props
 * @param {string} [props.primaryColor="#c87046"]
 */
export function CompleteShelfLandingPage({
  primaryColor = "#c87046"
}) {
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", primaryColor);
  }, [primaryColor]);

  return (
    <div className="menu-app-container" style={{ width: "100%", height: "100%", position: "relative" }}>
      <iframe
        src="./index.html"
        title="L'Atelier Gourmet Restaurant Menu"
        style={{
          width: "100%",
          height: "100vh",
          border: "none",
          display: "block"
        }}
      />
    </div>
  );
}

export default CompleteShelfLandingPage;
