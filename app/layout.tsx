import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Server Monitor - Real-time Server Status Dashboard',
  description: 'Monitor server status in real-time with Azure AD authentication',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
