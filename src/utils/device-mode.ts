import { useSyncExternalStore } from "react";

const MOBILE_VIEWPORT_MAX = 991;
const COMPACT_VIEWPORT_MAX = 575;
const HANDHELD_SCREEN_MAX = 1280;
const HANDHELD_LOGICAL_EDGE_MAX = 820;
const MOBILE_USER_AGENT_PATTERN =
  /android|iphone|ipad|ipod|iemobile|opera mini|mobile|silk/i;

type LayoutMode = "desktop" | "mobile";
type LayoutDensity = "regular" | "compact";
type LayoutState = {
  layoutMode: LayoutMode;
  density: LayoutDensity;
};

const LISTENER_OPTIONS: AddEventListenerOptions = {
  passive: true,
};

const getViewportWidth = () =>
  Math.max(
    Math.round(window.visualViewport?.width ?? 0),
    window.innerWidth || 0,
    document.documentElement.clientWidth || 0,
  );

const getViewportHeight = () =>
  Math.max(
    Math.round(window.visualViewport?.height ?? 0),
    window.innerHeight || 0,
    document.documentElement.clientHeight || 0,
  );

const getNarrowScreenEdge = () => {
  const screenEdge = Math.min(window.screen.width || 0, window.screen.height || 0);
  const viewportWidth = getViewportWidth();
  const viewportHeight = getViewportHeight();
  const viewportEdge =
    viewportWidth > 0 && viewportHeight > 0
      ? Math.min(viewportWidth, viewportHeight)
      : Math.max(viewportWidth, viewportHeight);
  const candidateEdges = [screenEdge, viewportEdge].filter(
    (edge): edge is number => edge > 0,
  );

  return candidateEdges.length ? Math.min(...candidateEdges) : 0;
};

const getNavigatorMobileHint = () => {
  const navigatorWithHints = navigator as Navigator & {
    userAgentData?: {
      mobile?: boolean;
    };
  };

  return navigatorWithHints.userAgentData?.mobile === true;
};

const isHandheldDevice = () => {
  const narrowScreenEdge = getNarrowScreenEdge();
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
  const viewportWidth = getViewportWidth();

  if (viewportWidth > 0 && viewportWidth <= MOBILE_VIEWPORT_MAX) {
    return "mobile";
  }

  return isHandheldDevice() ? "mobile" : "desktop";
};

const getLayoutDensity = (): LayoutDensity => {
  const viewportWidth = getViewportWidth();

  if (viewportWidth > 0 && viewportWidth <= COMPACT_VIEWPORT_MAX) {
    return "compact";
  }

  const narrowScreenEdge = getNarrowScreenEdge();
  const devicePixelRatio = Math.max(window.devicePixelRatio || 1, 1);
  const logicalScreenEdge = narrowScreenEdge / devicePixelRatio;

  return (narrowScreenEdge > 0 && narrowScreenEdge <= COMPACT_VIEWPORT_MAX) ||
    logicalScreenEdge <= COMPACT_VIEWPORT_MAX
    ? "compact"
    : "regular";
};

const getLayoutState = (): LayoutState => {
  const layoutMode = getLayoutMode();
  const density = layoutMode === "mobile" ? getLayoutDensity() : "regular";

  return {
    layoutMode,
    density,
  };
};

const applyLayoutState = ({ layoutMode, density }: LayoutState) => {
  const root = document.documentElement;
  root.dataset.vrLayout = layoutMode;
  root.dataset.vrDensity = density;
  root.classList.toggle("vr-handheld", layoutMode === "mobile");
};

const bindViewportChangeListeners = (listener: () => void) => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const visualViewport = window.visualViewport;

  window.addEventListener("resize", listener, LISTENER_OPTIONS);
  window.addEventListener("orientationchange", listener, LISTENER_OPTIONS);
  window.addEventListener("load", listener);
  window.addEventListener("pageshow", listener);
  visualViewport?.addEventListener("resize", listener, LISTENER_OPTIONS);

  return () => {
    window.removeEventListener("resize", listener);
    window.removeEventListener("orientationchange", listener);
    window.removeEventListener("load", listener);
    window.removeEventListener("pageshow", listener);
    visualViewport?.removeEventListener("resize", listener);
  };
};

export const syncDeviceMode = () => {
  const nextState = getLayoutState();

  applyLayoutState(nextState);

  return nextState;
};

export const initializeDeviceMode = () => {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  syncDeviceMode();

  return bindViewportChangeListeners(syncDeviceMode);
};

export const getClientLayoutMode = (): LayoutMode => {
  if (typeof window === "undefined") {
    return "desktop";
  }

  const rootLayout = document.documentElement.dataset.vrLayout;

  if (rootLayout === "mobile" || rootLayout === "desktop") {
    return rootLayout;
  }

  return syncDeviceMode().layoutMode;
};

const subscribeToDeviceLayout = (onStoreChange: () => void) =>
  bindViewportChangeListeners(() => {
    syncDeviceMode();
    onStoreChange();
  });

export const useDeviceLayout = () => {
  const layoutMode = useSyncExternalStore(
    subscribeToDeviceLayout,
    getClientLayoutMode,
    () => "desktop",
  );

  return {
    isMobileLayout: layoutMode === "mobile",
    layoutMode,
  };
};
