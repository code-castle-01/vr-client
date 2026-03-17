import React from "react";

export const AppIcon: React.FC = () => {
  return (
    <img
      src="/logo.png"
      alt="Logo Vegas del Rio"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        boxShadow: "0 8px 18px rgba(23, 35, 47, 0.14)",
      }}
    />
  );
};
