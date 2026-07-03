import { NavLink, useNavigate } from 'react-router-dom';
import { House, ArrowsLeftRight, Wallet, Robot, Camera } from '@phosphor-icons/react';

export default function BottomNav() {
  const navigate = useNavigate();

  const linkClass = ({ isActive }) => 
    `flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-all duration-150 grow h-full hover:text-text-primary ${
      isActive ? 'text-accent-green' : 'text-text-secondary'
    }`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-secondary-dark border-t border-border-dark z-[500] flex justify-around items-center pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] md:hidden">
      <NavLink to="/dashboard" className={linkClass}>
        <House size={22} />
        <span>Trang chủ</span>
      </NavLink>
      <NavLink to="/transactions" className={linkClass}>
        <ArrowsLeftRight size={22} />
        <span>Giao dịch</span>
      </NavLink>
      
      <div className="relative w-[60px] h-full flex items-center justify-center">
        <button
          className="absolute -top-7 w-14 h-14 rounded-full bg-accent-green text-primary-dark flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.4)] transition-all duration-250 border-none cursor-pointer z-[510] hover:-translate-y-0.5 hover:bg-accent-green-hover hover:shadow-[0_6px_16px_rgba(16,185,129,0.5)] active:translate-y-0 active:scale-[0.95]"
          onClick={() => navigate('/capture')}
          aria-label="Chụp hóa đơn"
        >
          <Camera size={26} weight="fill" />
        </button>
      </div>

      <NavLink to="/budgets" className={linkClass}>
        <Wallet size={22} />
        <span>Ngân sách</span>
      </NavLink>
      <NavLink to="/capture" className={linkClass}>
        <Robot size={22} />
        <span>Trợ lý AI</span>
      </NavLink>
    </nav>
  );
}
