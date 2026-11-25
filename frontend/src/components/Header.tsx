import { tr, useLocale } from '../i18n';

import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LanguageSelector } from '../i18n/LanguageSelector';

const publicNav = [
  { label: 'Home', path: '/' },
  { label: 'Knowledge', path: '/knowledge' },
  { label: 'Farm Tools', path: '/tools' },
];

const memberNav = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Farms', path: '/my-farms' },
  { label: 'Knowledge', path: '/knowledge' },
  { label: 'Farm Tools', path: '/tools' },
];

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';

const Logo: React.FC = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-profarm-forest text-white">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 14C7.5 14 5 11.4 5 7c4.6 0 7 2.5 7 7Z" fill="currentColor" opacity="0.85" />
      <path d="M12 11c0-4.4 2.4-7 7-7 0 4.4-2.5 7-7 7Z" fill="#E9A400" />
    </svg>
  </span>
);

export const Header: React.FC = () => {
  useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const navItems = user ? memberNav : publicNav;

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Close the account menu on outside click or Escape.
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setAccountOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      setMenuOpen(false);
      setAccountOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Unable to sign out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const desktopLink = (item: { label: string; path: string }) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        `rounded-full px-4 py-2 text-[15px] font-semibold transition-colors ${
          isActive ? 'bg-profarm-mist text-profarm-ink' : 'text-profarm-muted hover:text-profarm-ink'
        }`
      }
    >
      {tr(item.label)}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-profarm-border/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1440px] items-center gap-4 px-4 sm:px-8 lg:px-12">
        <Link to="/" aria-label={tr('ProFarm — Home')} className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <span className="font-display text-[22px] font-bold leading-none text-profarm-ink">{tr('ProFarm')}</span>
        </Link>

        <nav aria-label={tr('Main navigation')} className="mx-auto hidden items-center gap-1 lg:flex">
          {navItems.map(desktopLink)}
        </nav>

        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <LanguageSelector />

          {user ? (
            <div ref={accountRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                aria-label={tr('Account menu for {{v0}}', { v0: user.name })}
                className="flex h-11 items-center gap-2 rounded-full border border-profarm-border bg-white ps-1 pe-3 transition hover:border-profarm-sage"
              >
                <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-profarm-forest text-sm font-bold text-white">
                  {initials(user.name)}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="text-profarm-muted">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {accountOpen && (
                <div role="menu" className="absolute end-0 mt-2 w-72 overflow-hidden rounded-2xl border border-profarm-border bg-white shadow-[0_20px_50px_rgba(10,59,63,0.14)]">
                  <div className="border-b border-profarm-border px-4 py-3">
                    <p className="truncate font-semibold text-profarm-ink">{user.name}</p>
                    <p className="truncate text-sm text-profarm-muted">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link role="menuitem" to="/dashboard" className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-profarm-ink hover:bg-profarm-mist">
                      {tr('Dashboard')}
                    </Link>
                    <Link role="menuitem" to="/account/security" className="block rounded-xl px-3 py-2.5 text-[15px] font-medium text-profarm-ink hover:bg-profarm-mist">
                      {tr('Account security')}
                    </Link>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full rounded-xl px-3 py-2.5 text-start text-[15px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      {isLoggingOut ? tr('Signing out...') : tr('Sign Out')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 lg:flex">
              <Link to="/login" className="rounded-full px-4 py-2.5 text-[15px] font-semibold text-profarm-ink hover:bg-profarm-mist">
                {tr('Sign In')}
              </Link>
              <Link to="/signup" className="rounded-full bg-profarm-forest px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-profarm-deep">
                {tr('Create account')}
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label={menuOpen ? tr('Close navigation menu') : tr('Open navigation menu')}
            aria-expanded={menuOpen}
            aria-controls="profarm-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-profarm-border text-profarm-ink hover:bg-profarm-mist lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {menuOpen ? (<><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>) : (<><path d="M4 8h16" /><path d="M4 16h16" /></>)}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="profarm-mobile-navigation" className="border-t border-profarm-border bg-white px-4 pb-6 pt-3 sm:px-8 lg:hidden">
          <nav aria-label={tr('Mobile navigation')} className="flex flex-col">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3.5 text-base font-semibold ${isActive ? 'bg-profarm-mist text-profarm-ink' : 'text-profarm-muted'}`
                }
              >
                {tr(item.label)}
              </NavLink>
            ))}
            {user && (
              <NavLink to="/account/security" className="rounded-xl px-4 py-3.5 text-base font-semibold text-profarm-muted">
                {tr('Account security')}
              </NavLink>
            )}
          </nav>

          <div className="mt-4 border-t border-profarm-border pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-profarm-forest text-sm font-bold text-white">
                    {initials(user.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-profarm-ink">{user.name}</span>
                    <span className="block truncate text-sm text-profarm-muted">{user.email}</span>
                  </span>
                </div>
                <button type="button" onClick={handleLogout} disabled={isLoggingOut}
                  className="shrink-0 rounded-full border border-profarm-border px-4 py-2.5 font-semibold text-red-700 disabled:opacity-60">
                  {isLoggingOut ? tr('Signing out...') : tr('Sign Out')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link to="/login" className="rounded-full border border-profarm-border py-3 text-center font-semibold text-profarm-ink">{tr('Sign In')}</Link>
                <Link to="/signup" className="rounded-full bg-profarm-forest py-3 text-center font-semibold text-white">{tr('Create account')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
