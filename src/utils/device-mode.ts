import { useEffect, useState } from "react";

const MOBILE_VIEWPORT_MAX = 991;
const COMPACT_VIEWPORT_MAX = 575;
const HANDHELD_SCREEN_MAX = 1280;
const HANDHELD_LOGICAL_EDGE_MAX = 820;
const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipad|ipod|iemobile|opera mini|mobile|silk/i;

type LayoutMode = "desktop" | "mobile";
type LayoutDensity = "regular" | "compact";

const getNavigatorMobileHint = () => {
  const navigatorWithHints = navigator as Navigator & {
    userAgentData?: {
      mobile?: boolean;
    };
  };

  return navigatorWithHints.userAgentData?.mobile === true;
};

const isHandheldDevice = () => {
  const narrowScreenEdge = Math.min(window.screen.width || 0, window.screen.height || 0);
  const devicePixelRatio = Math.max(window.devicePixelRatio || 1, 1);
  const logicalScreenEdge = narrowScreenEdge / devicePixelRatio;
  const hasCoarsePointer =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(any-pointer: coarse)").matches;
  const hasTouch =
    "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
  const userAgentLooksMobile =
    getNavigatorMobileHint() || MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent);

  return (
    narrowScreenEdge > 0 &&
    (narrowScreenEdge <= HANDHELD_SCREEN_MAX ||
      logicalScreenEdge <= HANDHELD_LOGICAL_EDGE_MAX) &&
    (hasCoarsePointer || hasTouch || userAgentLooksMobile)
  );
};

const getLayoutMode = (): LayoutMode => {
  if (window.matchMedia(`(max-width: ${MOBILE_VIEWPORT_MAX}px)`).matches) {
    return "mobile";
  }

  return isHandheldDevice() ? "mobile" : "desktop";
};

const getLayoutDensity = (): LayoutDensity => {
  if (window.matchMedia(`(max-width: ${COMPACT_VIEWPORT_MAX}px)`).matches) {
    return "compact";
  }

  const narrowScreenEdge = Math.min(window.screen.width || 0, window.screen.height || 0);
  const devicePixelRatio = Math.max(window.devicePixelRatio || 1, 1);
  const logicalScreenEdge = narrowScreenEdge / devicePixelRatio;

  return (narrowScreenEdge > 0 && narrowScreenEdge <= COMPACT_VIEWPORT_MAX) ||
    logicalScreenEdge <= COMPACT_VIEWPORT_MAX
    ? "compact"
    : "regular";
};

export const syncDeviceMode = () => {
  const root = document.documentElement;
  const layoutMode = getLayoutMode();
  const density = layoutMode === "mobile" ? getLayoutDensity() : "regular";

  root.dataset.vrLayout = layoutMode;
  root.dataset.vrDensity = density;
  root.classList.toggle("vr-handheld", layoutMode === "mobile");
};

export const initializeDeviceMode = () => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  syncDeviceMode();

  const handleViewportChange = () => {
    syncDeviceMode();
  };

  window.addEventListener("resize", handleViewportChange, { passive: true });
  window.addEventListener("orientationchange", handleViewportChange, {
    passive: true,
  });

  return () => {
    window.removeEventListener("resize", handleViewportChange);
    window.removeEventListener("orientationchange", handleViewportChange);
  };
};

export const getClientLayoutMode = (): LayoutMode => {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const rootLayout = document.documentElement.dataset.vrLayout;

  if (rootLayout === "mobile" || rootLayout === "desktop") {
    return rootLayout;
  }

  return getLayoutMode();
};

export const useDeviceLayout = () => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() =>
    getClientLayoutMode(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleViewportChange = () => {
      setLayoutMode(getLayoutMode());
    };

    handleViewportChange();

    window.addEventListener("resize", handleViewportChange, { passive: true });
    window.addEventListener("orientationchange", handleViewportChange, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("orientationchange", handleViewportChange);
    };
  }, []);

  return {
    isMobileLayout: layoutMode === "mobile",
    layoutMode,
  };
};
