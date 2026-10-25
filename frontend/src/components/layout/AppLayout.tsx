import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { Header } from './Header';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Header />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
};
