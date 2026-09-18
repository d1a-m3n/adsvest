import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  WalletCards,
  UsersRound,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

const menuItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    label: "Users",
    icon: Users,
    path: "/admin/dashboard/users",
  },
  {
    label: "Tasks",
    icon: BriefcaseBusiness,
    path: "/admin/dashboard/opportunities",
  },
  {
    label: "Withdrawals",
    icon: WalletCards,
    path: "/admin/dashboard/withdrawals",
  },
  {
    label: "Referrals",
    icon: UsersRound,
    path: "/admin/dashboard/referrals",
  },
];

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-xl border border-[#2b2c35] bg-[#181920] p-2.5 text-gray-300 transition hover:bg-blue-500/10 hover:text-blue-400 md:hidden"
        aria-label="Toggle admin menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-[#2b2c35] bg-[#0b0c10] px-4 py-6 transition-all duration-300 md:relative md:z-auto ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } ${
          isOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full w-64 md:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div
          className={`mb-8 flex items-center ${
            isCollapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!isCollapsed && (
            <div className="px-3">
              <h1 className="text-2xl font-bold text-blue-500">
                Advest
              </h1>

              <p className="mt-1 text-xs text-gray-500">
                Admin Dashboard
              </p>
            </div>
          )}

          {/* Collapse button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-2 text-gray-500 transition hover:bg-blue-500/10 hover:text-blue-400 md:block"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/admin/dashboard"}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isCollapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-blue-500/10 text-blue-400"
                      : "text-gray-400 hover:bg-blue-500/5 hover:text-blue-400"
                  }`
                }
              >
                <Icon size={20} />

                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}