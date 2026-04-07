import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APIForge — API Client",
  description: "A powerful API client for teams. Free, open, and fast.",
};

import { SyncProvider } from "@/components/SyncProvider";
import { AuthGuard } from "@/components/AuthGuard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ height: "100vh", overflow: "hidden" }}>
        <AuthGuard>
          <SyncProvider>{children}</SyncProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
