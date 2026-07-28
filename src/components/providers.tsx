"use client";

import { App, ConfigProvider, theme } from "antd";
import { RecoilRoot } from "recoil";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 12,
        },
      }}
    >
      <App>
        <RecoilRoot>{children}</RecoilRoot>
      </App>
    </ConfigProvider>
  );
}
