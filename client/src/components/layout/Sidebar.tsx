import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Receipt,
  CheckSquare,
  FileSpreadsheet,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  const employeeLinks = [
    { to: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/employee/create-voucher', label: 'Create Voucher', icon: PlusCircle },
    { to: '/employee/my-vouchers', label: 'My Vouchers', icon: Receipt },
  ];

  const directorLinks = [
    { to: '/director/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/director/pending', label: 'Pending Approvals', icon: CheckSquare },
    { to: '/director/all-vouchers', label: 'All Vouchers', icon: FileSpreadsheet },
  ];

  const accountsLinks = [
    { to: '/accounts/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/accounts/all-vouchers', label: 'All Vouchers', icon: FileSpreadsheet },
  ];

  let currentLinks = employeeLinks;
  if (user.role === UserRole.DIRECTOR) currentLinks = directorLinks;
  if (user.role === UserRole.ACCOUNTS) currentLinks = accountsLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-navy-900 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-sm text-white tracking-wide block leading-none">
                PSPL Expense
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Voucher System
              </span>
            </div>
          )}
        </div>

        {/* Desktop collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      {!isCollapsed && (
        <div className="px-4 py-3 mx-3 my-3 bg-navy-800/60 border border-navy-700/50 rounded-lg">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Workspace
          </p>
          <p className="text-xs font-bold text-white mt-0.5">
            {user.role === UserRole.EMPLOYEE && 'Employee Portal'}
            {user.role === UserRole.DIRECTOR && 'Executive Director'}
            {user.role === UserRole.ACCOUNTS && 'Accounts & Finance'}
          </p>
        </div>
      )}

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {currentLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`
              }
              title={isCollapsed ? link.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!isCollapsed && <span className="truncate">{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-navy-800 text-xs text-slate-400">
        {!isCollapsed ? (
          <div>
            <p className="font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] truncate text-slate-400">{user.department || user.role}</p>
          </div>
        ) : (
          <div className="text-center font-bold text-white text-xs">
            {user.name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block transition-all duration-300 ease-in-out shrink-0 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="fixed inset-y-0 left-0 h-screen transition-all duration-300 ease-in-out z-30" style={{ width: isCollapsed ? '5rem' : '16rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80%] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
