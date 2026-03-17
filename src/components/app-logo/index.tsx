import React from "react";

type AppLogoProps = {
  alt?: string;
  className?: string;
  priority?: boolean;
  size?: number;
  style?: React.CSSProperties;
};

const LOGO_SRC = "/logo-ui.png";

export const AppLogo = React.memo<AppLogoProps>(
  ({ alt = "Logo CCVR", className, priority = false, size = 48, style }) => {
    return (
      <img
        src={LOGO_SRC}
        alt={alt}
        className={className}
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        fetchPriority={priority ? "high" : "low"}
        loading={priority ? "eager" : "lazy"}
        style={{
          display: "block",
          height: size,
          objectFit: "contain",
          width: size,
          ...style,
        }}
      />
    );
  },
);

AppLogo.displayName = "AppLogo";
