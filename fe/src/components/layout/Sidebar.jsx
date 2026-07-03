import { NavLink, useNavigate } from "react-router-dom";
import {
  House,
  ArrowsLeftRight,
  Wallet,
  Robot,
  SignOut,
  Star,
  Tag,
} from "@phosphor-icons/react";
import { useAuth } from "../../context/AuthContext";
import Button from "../common/Button";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2);
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-4 p-4 text-text-secondary rounded-xl font-medium text-sm transition-all duration-150 hover:bg-tertiary-dark hover:text-text-primary ${
      isActive ? "bg-accent-subtle text-accent-green" : ""
    }`;

  return (
    <aside className="w-[260px] bg-secondary-dark border-r border-border-dark flex flex-col h-screen fixed left-0 top-0 bottom-0 z-100 hidden md:flex">
      <div className="p-6 flex items-center gap-2 text-accent-green font-bold text-xl">
        <Star size={24} weight="fill" />
        <span>SmartSpend</span>
      </div>

      <nav className="flex flex-col gap-1 px-4 grow">
        <NavLink to="/dashboard" className={navLinkClass}>
          <House size={20} />
          <span>Trang chủ</span>
        </NavLink>
        <NavLink to="/transactions" className={navLinkClass}>
          <ArrowsLeftRight size={20} />
          <span>Giao dịch</span>
        </NavLink>
        <NavLink to="/budgets" className={navLinkClass}>
          <Wallet size={20} />
          <span>Ngân sách</span>
        </NavLink>
        <NavLink to="/categories" className={navLinkClass}>
          <Tag size={20} />
          <span>Danh mục</span>
        </NavLink>
        <NavLink to="/capture" className={navLinkClass}>
          <Robot size={20} />
          <span>Trợ lý AI</span>
        </NavLink>
      </nav>

      <div className="p-6 border-t border-border-dark flex flex-col gap-4">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-accent-subtle text-accent-green flex items-center justify-center font-bold text-md uppercase">
              {getInitials(user.fullname)}
            </div>
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-sm font-semibold text-text-primary truncate">
                {user.fullname}
              </span>
              <span className="text-xs text-text-muted truncate">
                {user.email}
              </span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="md"
          icon={<SignOut size={18} />}
          onClick={handleLogout}
          fullWidth
        >
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
