import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'APIForge — API Client',
  description: 'A powerful API client for teams. Free, open, and fast.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100vh', overflow: 'hidden' }}>{children}</body>
    </html>
  );
}
