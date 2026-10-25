import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

export const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Knowledge', path: '/knowledge' },
    { label: 'Farm Tools', path: '/tools' },
  ];

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-green-700">ProFarm</span>
            <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded">V2</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`transition-colors ${
                location.pathname === item.path
                  ? 'text-green-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-600 hidden sm:inline-block">
                Signed in as <strong className="text-slate-800">{user.name}</strong>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-sm px-3 py-1.5 rounded-md text-slate-700 hover:text-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-sm px-3 py-1.5 rounded-md bg-green-700 text-white hover:bg-green-800 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
