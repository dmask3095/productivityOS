import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'ProductivityOS',
  description: 'Your personal productivity operating system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minHeight: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
