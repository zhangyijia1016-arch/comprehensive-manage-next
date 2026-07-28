import "antd/dist/reset.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: "Comprehensive Manage",
  description: "Student comprehensive testing management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
