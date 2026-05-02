import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/users", label: "Users" },
  { to: "/settings", label: "Platform Settings" },
  { to: "/admins/new", label: "Create Admin" },
];

export function Layout() {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="font-bold text-lg text-green-400"
              >
                Snap Cals Admin
              </Link>
              <div className="hidden md:flex gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`text-sm px-2 py-1 rounded ${
                      location.pathname.startsWith(item.to)
                        ? "text-green-400 font-medium bg-gray-800"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-500">{admin?.email}</span>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Logout
              </button>
            </div>
            <button
              type="button"
              className="md:hidden p-2 text-gray-400"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-gray-800 px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`block text-sm px-2 py-2 rounded ${
                  location.pathname.startsWith(item.to)
                    ? "text-green-400 font-medium bg-gray-800"
                    : "text-gray-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-800 pt-2 mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-500">{admin?.email}</span>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
