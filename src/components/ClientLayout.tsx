'use client';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

const NO_SIDEBAR = ['/login', '/register'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', minHeight: '100vh' }}>
        {children}
      </main>
    </>
  );
}
