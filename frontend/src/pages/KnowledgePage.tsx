import React from 'react';

export const KnowledgePage: React.FC = () => {
  return (
    <div className="border border-slate-200 bg-white rounded-lg p-6 shadow-sm">
      <h1 className="text-xl font-bold text-slate-900">Agricultural Knowledge Base</h1>
      <p className="mt-2 text-sm text-slate-600">
        Placeholder route for the consolidated Soil Wiki and Crop Encyclopedia. In later phases,
        this module will host curated agronomic knowledge, soil characteristics, and disease management guides.
      </p>
      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
        Status: Clean route initialized. Migration of legacy crop/soil datasets pending Phase 3.
      </div>
    </div>
  );
};
