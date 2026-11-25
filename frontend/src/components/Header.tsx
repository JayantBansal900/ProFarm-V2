import { tr, useLocale } from '../i18n';

import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LanguageSelector } from '../i18n/LanguageSelector';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Knowledge', path: '/knowledge' },
  { label: 'Farm Tools', path: '/tools' },
  { label: 'My Farms', path: '/my-farms' },
];

export const Header: React.FC = () => {
  useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path ||
        location.pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
      setMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Unable to sign out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navigationLink = (item: (typeof navItems)[number], mobile = false) => {
    const active = isActive(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        aria-current={active ? 'page' : undefined}
        onClick={() => setMenuOpen(false)}
        className={
          mobile
            ? `flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#DDECDC] text-[#22484D]'
                  : 'text-[#4D5D59] hover:bg-[#F0F4F3] hover:text-[#22484D]'
              }`
            : `group relative whitespace-nowrap py-2 text-[15px] font-semibold tracking-normal transition-colors duration-200 ${
                active
                  ? 'text-[#22484D]'
                  : 'text-[#64706D] hover:text-[#22484D]'
              }`
        }
      >
        {tr(item.label)}

        {!mobile && (
          <span
            aria-hidden="true"
            className={`absolute bottom-0 left-0 h-[2px] rounded-full bg-[#48765C] transition-all duration-300 ${
              active ? 'w-full' : 'w-0 group-hover:w-full'
            }`}
          />
        )}

        {mobile && active && (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-[#48765C]"
          />
        )}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#DBE7DB] bg-[#F6F8F8]/95 shadow-[0_2px_24px_rgba(31,61,42,0.035)] backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-[1440px] flex-wrap items-center justify-between gap-2 py-2 px-3 sm:px-8 lg:px-12">
        {/* Brand */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          aria-label={tr("ProFarm — Home")}
          className="group flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#48765C]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#22484D] text-[#F0F4F3] shadow-[0_6px_14px_rgba(36,75,53,0.14)] transition-transform duration-300 group-hover:-rotate-6">
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 20V10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <path
                d="M12 14C7.5 14 5 11.4 5 7c4.6 0 7 2.5 7 7Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M12 11c0-4.4 2.4-7 7-7 0 4.4-2.5 7-7 7Z"
                fill="currentColor"
              />
              <path
                d="M5 20h14"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <span className="flex flex-col leading-none">
            <span className="text-[22px] font-extrabold tracking-[-0.065em] text-[#22484D]">{tr("ProFarm")}<span className="text-[#6DA473]">.</span>
            </span>
            <span className="mt-1 text-[9px] font-bold tracking-normal text-[#73897C]">{tr("Grow with clarity")}</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label={tr("Main navigation")}
          className="hidden items-center gap-4 xl:gap-6 xl:flex"
        >
          {navItems.map((item) => navigationLink(item))}
        </nav>

        {/* Desktop Authentication */}
        <LanguageSelector />
        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          {user ? (
            <>
              <div className="hidden max-w-[150px] flex-col items-end xl:flex">
                <span className="text-[10px] font-medium text-[#86958E]">{tr("Welcome back")}</span>
                <span className="max-w-full truncate text-[13px] font-bold text-[#22484D]">
                  {user.name}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-full border border-[#C8D9CE] px-5 py-2.5 text-[12px] font-bold text-[#22484D] transition-all duration-200 hover:border-[#22484D] hover:bg-[#E6F0E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48765C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? tr("Signing out...") : tr("Sign Out")}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-2.5 text-[12px] font-bold text-[#22484D] transition-colors hover:bg-[#E6F0E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48765C]"
              >{tr("Sign In")}</Link>

              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-[#22484D] px-5 py-3 text-[12px] font-bold text-white shadow-[0_5px_14px_rgba(36,75,53,0.14)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#325D5F] hover:shadow-[0_8px_20px_rgba(36,75,53,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48765C]"
              >{tr("Get Started")}<span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={menuOpen ? tr("Close navigation menu") : tr("Open navigation menu")}
          aria-expanded={menuOpen}
          aria-controls="profarm-mobile-navigation"
          onClick={() => setMenuOpen((previous) => !previous)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D7E6DB] text-[#22484D] transition-colors hover:bg-[#E6F0E6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48765C] xl:hidden"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {menuOpen ? (
              <>
                <path d="M5 5l14 14" />
                <path d="M19 5L5 19" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div
          id="profarm-mobile-navigation"
          className="border-t border-[#DBE7DB] bg-[#F6F8F8] px-5 pb-6 pt-4 shadow-[0_16px_25px_rgba(31,61,42,0.08)] sm:px-8 xl:hidden"
        >
          <nav
            aria-label={tr("Mobile navigation")}
            className="mx-auto flex max-w-[1440px] flex-col gap-1"
          >
            {navItems.map((item) => navigationLink(item, true))}
          </nav>

          <div className="mx-auto mt-5 max-w-[1440px] border-t border-[#DBE7DB] pt-5">
            {user ? (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-[#86958E]">{tr("Signed in as")}</span>
                  <span className="truncate text-sm font-bold text-[#22484D]">
                    {user.name}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-full border border-[#C8D9CE] px-5 py-2.5 text-sm font-semibold text-[#22484D] hover:bg-[#E6F0E6] disabled:opacity-60"
                >
                  {isLoggingOut ? tr("Signing out...") : tr("Sign Out")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-full border border-[#C8D9CE] px-5 py-3 text-center text-sm font-semibold text-[#22484D]"
                >{tr("Sign In")}</Link>

                <Link
                  to="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex-1 rounded-full bg-[#22484D] px-5 py-3 text-center text-sm font-semibold text-white"
                >{tr("Get Started")}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
