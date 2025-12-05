import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
