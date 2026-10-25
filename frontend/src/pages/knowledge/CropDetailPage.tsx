import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCropBySlug } from '../../data/crops';
import { getSoilById } from '../../data/soils';

export const CropDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const crop = slug ? getCropBySlug(slug) : undefined;

  if (!crop) {
    return (
      <div className="max-w-xl mx-auto my-12 border border-slate-200 bg-white rounded-xl p-8 text-center shadow-sm space-y-4">
        <div className="text-4xl">🌾</div>
        <h1 className="text-2xl font-bold text-slate-900">Crop Not Found</h1>
        <p className="text-sm text-slate-600">
          The requested crop profile <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-xs">/knowledge/crops/{slug}</code> does not exist in our agricultural catalog.
        </p>
        <div className="pt-2">
          <Link
            to="/knowledge/crops"
            className="inline-flex items-center px-4 py-2 rounded-md bg-green-700 text-white font-medium text-sm hover:bg-green-800 transition"
          >
            ← Back to Crop Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link to="/knowledge" className="hover:text-green-700">Knowledge Explorer</Link>
        <span>/</span>
        <Link to="/knowledge/crops" className="hover:text-green-700">Crops</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{crop.name}</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <span className="text-4xl sm:text-5xl p-3 bg-amber-50 border border-amber-200 rounded-xl">
              {crop.icon}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {crop.category}
                </span>
                {crop.seasons.map((season) => (
                  <span
                    key={season}
                    className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                  >
                    {season} Season
                  </span>
                ))}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{crop.name}</h1>
              {crop.hindiName && (
                <p className="text-base text-slate-600 font-medium">{crop.hindiName}</p>
              )}
              <p className="text-sm italic font-serif text-slate-500 mt-0.5">
                Scientific classification: {crop.scientificName}
              </p>
            </div>
          </div>

          <Link
            to="/knowledge/crops"
            className="self-start text-xs font-semibold px-3 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        <p className="mt-5 text-sm sm:text-base text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
          {crop.shortDescription}
        </p>
      </div>

      {/* Primary Agronomic Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Growing Season & Calendar */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
            <span>🗓️</span>
            <h2>Sowing & Harvest Calendar</h2>
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <p><strong className="text-slate-700">Sowing Window:</strong> {crop.sowingAndHarvest.sowingPeriod}</p>
            <p><strong className="text-slate-700">Harvest Period:</strong> {crop.sowingAndHarvest.harvestPeriod}</p>
            {crop.sowingAndHarvest.germinationDays && (
              <p><strong className="text-slate-700">Germination Time:</strong> {crop.sowingAndHarvest.germinationDays}</p>
            )}
          </div>
        </div>

        {/* Climate & Temperature */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
            <span>🌡️</span>
            <h2>Temperature Preference</h2>
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <p className="text-base font-bold text-slate-900">
              {crop.temperatureRange.minC}°C – {crop.temperatureRange.maxC}°C
            </p>
            <p className="leading-relaxed">{crop.temperatureRange.description}</p>
          </div>
        </div>

        {/* Water & Irrigation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-slate-800 font-semibold text-sm">
            <span>💧</span>
            <h2>Water Requirements</h2>
          </div>
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <p className="text-base font-bold text-slate-900">
              {crop.waterRequirement.level} Demand
              {crop.waterRequirement.annualMm && (
                <span className="text-xs font-normal text-slate-500 ml-1.5">
                  ({crop.waterRequirement.annualMm})
                </span>
              )}
            </p>
            <p className="leading-relaxed">{crop.waterRequirement.description}</p>
          </div>
        </div>
      </div>

      {/* Suitable Soil Types Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <span>🌱</span>
          <span>Suitable Soil Types & Characteristics</span>
        </h2>
        <p className="text-xs text-slate-600">
          Click on any soil type below to explore detailed physical properties, nutrient retention dynamics, and improvement strategies:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {crop.suitableSoilIds.map((soilId) => {
            const soil = getSoilById(soilId);
            if (!soil) return null;
            return (
              <Link
                key={soil.id}
                to={`/knowledge/soils/${soil.slug}`}
                className="border border-slate-200 rounded-lg p-3 hover:border-green-400 hover:bg-green-50/50 transition group flex items-start space-x-3"
              >
                <span className="text-xl p-1.5 bg-slate-100 rounded-md group-hover:bg-green-100 transition">
                  {soil.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-green-800 transition">
                    {soil.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1">
                    Drainage: {soil.drainage}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Field Operations & Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Soil Preparation & Sowing */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🚜</span>
            <span>Seedbed Preparation & Tilth</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {crop.soilPreparation}
          </p>
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-800 mb-1">Irrigation Management:</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {crop.irrigationGuidance}
            </p>
          </div>
        </div>

        {/* Sustainable Farming Practices */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>♻️</span>
            <span>Sustainable & Resource-Saving Practices</span>
          </h2>
          <ul className="text-xs text-slate-700 space-y-2">
            {crop.sustainablePractices.map((practice, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span className="leading-relaxed">{practice}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Common Challenges & Diseases */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <span>🛡️</span>
          <span>Common Cultivation Challenges & Pest Vectors</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {crop.commonChallenges.map((challenge, idx) => (
            <div
              key={idx}
              className="p-3 bg-red-50/50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1"
            >
              <div className="font-semibold flex items-center space-x-1.5 text-red-800">
                <span>⚠️</span>
                <span>Challenge #{idx + 1}</span>
              </div>
              <p className="leading-relaxed">{challenge}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Source References & Citations */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <h3 className="font-semibold text-slate-800 flex items-center space-x-1.5">
          <span>📚</span>
          <span>Institutional Research References & Agronomic Sources</span>
        </h3>
        <ul className="space-y-1 list-disc list-inside">
          {crop.sources.map((src, idx) => (
            <li key={idx}>
              {src.url ? (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 hover:underline font-medium"
                >
                  {src.name}
                </a>
              ) : (
                <span className="font-medium text-slate-700">{src.name}</span>
              )}
              {src.organization && (
                <span className="text-slate-500"> — {src.organization}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Advisory Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
        <strong>Extension Advisory:</strong> Sowing periods, irrigation schedules, and seed varieties are broad recommendations. Farmers are advised to consult the regional package of practices issued by their State Agricultural University (SAU) or local Krishi Vigyan Kendra (KVK) for specific microclimatic guidance.
      </div>
    </div>
  );
};
