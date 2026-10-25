import React from 'react';
import { Link } from 'react-router-dom';
import { CROPS_DATA } from '../../data/crops';
import { SOILS_DATA } from '../../data/soils';

export const KnowledgeHubPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-green-800 to-emerald-700 text-white rounded-xl p-8 shadow-sm">
        <div className="max-w-3xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-900/60 text-green-200 border border-green-500/30 mb-4">
            ProFarm Knowledge Base • India Agronomy
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Crop & Soil Knowledge Explorer
          </h1>
          <p className="mt-3 text-green-100 text-base sm:text-lg leading-relaxed">
            Accessible, evidence-based agronomic insights curated for Indian farmers, agricultural students, and rural entrepreneurs. Explore optimal growing seasons, soil compatibility, and sustainable practices.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              to="/knowledge/crops"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-white text-green-800 font-semibold text-sm hover:bg-green-50 transition shadow-sm"
            >
              Browse {CROPS_DATA.length} Crops →
            </Link>
            <Link
              to="/knowledge/soils"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-green-900/50 text-white border border-green-400/40 font-semibold text-sm hover:bg-green-900/80 transition"
            >
              Explore {SOILS_DATA.length} Soil Types →
            </Link>
          </div>
        </div>
      </div>

      {/* Explorer Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crops Hub Card */}
        <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm hover:border-green-300 transition flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-2xl mb-4 border border-amber-200">
              🌾
            </div>
            <h2 className="text-xl font-bold text-slate-900">Crop Knowledge Catalog</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Detailed agronomic profiles for major Indian cereals, pulses, oilseeds, fibers, and tubers. Features temperature tolerances, water requirements, sowing windows, and sustainable crop protection guidelines.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Kharif Crops</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Rabi Crops</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Zaid / Summer</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Integrated Pest Mgmt</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {CROPS_DATA.length} crops cataloged
            </span>
            <Link
              to="/knowledge/crops"
              className="text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
            >
              Open Crop Catalog & Search →
            </Link>
          </div>
        </div>

        {/* Soils Hub Card */}
        <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm hover:border-emerald-300 transition flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl mb-4 border border-emerald-200">
              🌱
            </div>
            <h2 className="text-xl font-bold text-slate-900">Soil Health & Characteristics</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Understand the drainage behavior, moisture capacity, physical textures, and organic improvement techniques for common agricultural soils across India. Learn which crops thrive in specific soil textures.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Drainage & Aeration</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Organic Amelioration</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Nutrient Dynamics</span>
              <span className="bg-slate-100 px-2.5 py-1 rounded-md">Texture Profiling</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {SOILS_DATA.length} primary soil types
            </span>
            <Link
              to="/knowledge/soils"
              className="text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
            >
              Open Soil Explorer →
            </Link>
          </div>
        </div>
      </div>

      {/* Advisory & Extension Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-900">
        <div className="flex items-start space-x-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-amber-950">
              Agricultural Extension & Agronomic Advisory Notice
            </h3>
            <p className="mt-1 text-xs text-amber-800 leading-relaxed">
              The information in this Knowledge Base provides broad, peer-reviewed educational guidance sourced from ICAR institutions, agricultural universities, and the FAO. Soil pH, microclimate, local rainfall distribution, seed varieties, and pest pressures vary significantly across agro-climatic zones. Farmers should always consult their nearest <strong>Krishi Vigyan Kendra (KVK)</strong> or District Agriculture Officer for farm-specific seed varieties, fertilizer dosages, and spray recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
