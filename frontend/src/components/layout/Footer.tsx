import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <div>
          <span>&copy; {new Date().getFullYear()} ProFarm. Sustainable Agriculture & Farm Knowledge.</span>
        </div>
        <div className="mt-2 sm:mt-0 space-x-4">
          <span>Phase 2 Foundation</span>
          <span>&bull;</span>
          <span>Node / Express / React / SQLite</span>
        </div>
      </div>
    </footer>
  );
};
