import React from 'react';
import { Link } from 'react-router-dom';

export const ToolsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Farm Tools & Decision Analytics</h1>
            <p className="mt-1 text-sm text-slate-600">
              Interactive agronomic tools, real-time weather alerts, and data-driven farming calculators.
            </p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 self-start sm:self-auto">
            3 Live Tools Available
          </span>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Featured Live Tool: Weather & Rainfall Forecasting */}
        <div className="border-2 border-emerald-500 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse">
              LIVE
            </span>
          </div>

          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl mb-4">
              🌦️
            </div>
            <h2 className="text-lg font-bold text-slate-900">Live Weather & Rainfall Intelligence</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Real-time meteorological monitoring powered by Open-Meteo. Features hyper-local Indian village/city search, 
              7-day rainfall forecasting (sum vs probability), heavy rain alerts, and rule-based farmer agronomic advisories.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">Open-Meteo API</span>
              <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">Rainfall Sum vs Prob</span>
              <span className="px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 font-medium">Farmer Alerts</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/tools/weather"
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Open Weather Tool &rarr;
            </Link>
          </div>
        </div>

        {/* Featured Live Tool: Mandi Price Tracker */}
        <div className="border-2 border-emerald-500 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse">
              LIVE
            </span>
          </div>

          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl mb-4">
              ⚖️
            </div>
            <h2 className="text-lg font-bold text-slate-900">Mandi Price Tracker & Trends</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Live daily agricultural wholesale market prices across Indian APMCs powered by data.gov.in / AGMARKNET.
              Explore modal rates, compare mandis like-for-like, and filter by state, district, and commodity.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">data.gov.in AGMARKNET</span>
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 font-medium">Wholesale Modal Rates</span>
              <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">Market Comparison</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/tools/mandi"
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Open Mandi Tracker &rarr;
            </Link>
          </div>
        </div>

        {/* Featured Live Tool: Sustainable Farming Advisor */}
        <div className="border-2 border-emerald-500 bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse">
              LIVE
            </span>
          </div>

          <div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-2xl mb-4">
              🌱
            </div>
            <h2 className="text-lg font-bold text-slate-900">Sustainable Farming Advisor</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Synthesizes crop agronomy, soil dynamics, and live agrometeorological forecasts into explainable, 
              resource-saving guidance. Evaluates crop-soil compatibility and delivers weather-triggered actionable alerts.
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">ICAR Standard</span>
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 font-medium">Soil Compatibility</span>
              <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">Weather Triggered</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/tools/advisor"
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Open Advisor &rarr;
            </Link>
          </div>
        </div>

        {/* Coming Soon: Farm Economic Planner */}
        <div className="border border-slate-200 bg-slate-50/60 rounded-xl p-6 flex flex-col justify-between opacity-85">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-2xl">
                📊
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-200 text-slate-700">
                Phase 3F
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-700">Farm Economic Planner & Cost Calculator</h2>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Calculates comprehensive cost of cultivation, operational expenditure breakdown, and potential net revenue across varied input regimes.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-400 font-medium italic">Available in upcoming release</span>
          </div>
        </div>
      </div>
    </div>
  );
};
