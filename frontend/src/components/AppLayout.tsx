import { tr, useLocale } from '../i18n';

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { AuthProvider } from '../context/AuthContext';
import { Header } from './Header';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  const language = useLocale();
  const { pathname } = useLocation();

  // Pages that require an edge-to-edge layout.
  const isFullWidthPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup';

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-[#F8F7F2] font-sans text-[#203B2D] antialiased">
        {/* Accessibility: skip navigation */}
        <a
          href="#main-content"
          className="sr-only z-[100] rounded-md bg-[#203B2D] px-5 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >{tr("Skip to main content")}</a>

        {/* Shared navigation */}
        <Header />
        {language !== 'en' && <aside className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs leading-relaxed text-amber-950" aria-label={tr('Translation preview')}>
          {tr('Some text remains in English. Translations need native-language review.')}
        </aside>}

        {/* Main application content */}
        <main
          id="main-content"
          className={
            isFullWidthPage
              ? 'relative flex w-full flex-1 flex-col'
              : 'relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pt-14'
          }
        >
          <Outlet />
        </main>

        {/* Shared footer */}
        <Footer />
      </div>
    </AuthProvider>
  );
};
