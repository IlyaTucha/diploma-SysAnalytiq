import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/navigation/AppSidebar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
