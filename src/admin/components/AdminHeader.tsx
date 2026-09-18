import {
  UserCircle,
  LogOut,
} from "lucide-react";
import { useState } from "react";

export default function AdminHeader() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = () => {
    // Temporary logout behavior.
    // We will connect this to the real admin auth system later.
    window.location.href = "/login";
  };

  return (
    <header className="mb-6 flex min-h-14 items-center justify-between gap-4 pl-14 md:pl-0">
      {/* Header title */}
      <div className="min-w-0">
        <p className="text-sm text-gray-500">
          Admin Panel
        </p>

        <h1 className="truncate text-lg font-bold text-white sm:text-xl">
          Advest Administration
        </h1>
      </div>

      {/* Header actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">

        {/* Admin profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 rounded-xl px-1 py-1.5 transition hover:bg-white/5 sm:px-2"
            aria-label="Admin profile"
          >
            <UserCircle
              size={30}
              className="text-blue-500 sm:h-8 sm:w-8"
            />

            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-white">
                Admin
              </p>

              <p className="text-xs text-gray-500">
                Administrator
              </p>
            </div>
          </button>

          {/* Profile dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 top-14 z-50 w-52 overflow-hidden rounded-xl border border-[#2b2c35] bg-[#181920] py-1 shadow-2xl">
              <div className="border-b border-[#2b2c35] px-4 py-3">
                <p className="text-sm font-medium text-white">
                  Admin
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Administrator
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}