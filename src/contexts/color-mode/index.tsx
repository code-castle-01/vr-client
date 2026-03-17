import {
  type PropsWithChildren,
  createContext,
} from "react";
import { ConfigProvider, theme } from "antd";
import esES from "antd/locale/es_ES";

type ColorModeContextType = {
  mode: string;
  setMode: (mode: string) => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType
);

export const ColorModeContextProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const { defaultAlgorithm } = theme;

  return (
    <ColorModeContext.Provider
      value={{
        setMode: () => undefined,
        mode: "light",
      }}
    >
      <ConfigProvider
        locale={esES}
        theme={{
          algorithm: defaultAlgorithm,
          token: {
            colorPrimary: "#bf7a2d",
            colorInfo: "#bf7a2d",
            colorSuccess: "#2a8f63",
            colorWarning: "#d48d28",
            colorError: "#c2573f",
            colorTextBase: "#17232f",
            colorBgBase: "#fffdf9",
            colorBorder: "rgba(139, 76, 22, 0.16)",
            colorLink: "#8b4c16",
            colorLinkHover: "#d8953e",
            borderRadius: 18,
            borderRadiusLG: 24,
            fontFamily: '"Manrope", sans-serif',
          },
          components: {
            Button: {
              borderRadius: 16,
              controlHeight: 44,
              fontWeight: 700,
            },
            Card: {
              borderRadiusLG: 28,
            },
            Input: {
              borderRadius: 16,
              controlHeight: 46,
            },
            Layout: {
              headerBg: "rgba(255, 251, 243, 0.84)",
              bodyBg: "transparent",
              siderBg: "#17232f",
            },
            Menu: {
              darkItemBg: "transparent",
              darkSubMenuItemBg: "transparent",
              darkItemSelectedBg: "rgba(247, 198, 106, 0.22)",
              darkItemHoverColor: "#fff8ea",
              darkItemSelectedColor: "#fff8ea",
            },
            Table: {
              borderColor: "rgba(139, 76, 22, 0.08)",
              headerBg: "#fff7e8",
              headerColor: "#314455",
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </ColorModeContext.Provider>
  );
};
