import React from "react";
import { AppLogo } from "../app-logo";

export const AppIcon: React.FC = () => {
  return (
    <AppLogo
      alt="Logo CCVR"
      priority
      size={32}
      style={{
        borderRadius: "50%",
        boxShadow: "0 8px 18px rgba(23, 35, 47, 0.14)",
      }}
    />
  );
};
