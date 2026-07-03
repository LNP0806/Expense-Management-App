import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Star, SignOut } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Spinner from '../common/Spinner';

export default function AppShell() {
  const { isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-dark">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-primary-dark text-text-primary">
      <Sidebar />
      
      <div className="grow flex flex-col min-h-screen transition-[padding] duration-250 md:pl-[260px] pb-[84px] md:pb-0">
        <header className="h-14 px-6 flex items-center justify-between border-b border-border-dark bg-secondary-dark sticky top-0 z-90 md:hidden">
          <div className="flex items-center gap-2 text-accent-green font-bold">
            <Star size={20} weight="fill" />
            <span>SmartSpend</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="bg-transparent border-none text-text-secondary flex cursor-pointer"
            aria-label="Đăng xuất"
          >
            <SignOut size={20} />
          </button>
        </header>

        <main className="grow relative">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
