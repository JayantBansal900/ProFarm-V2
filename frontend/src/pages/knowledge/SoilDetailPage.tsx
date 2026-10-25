import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSoilBySlug } from '../../data/soils';
import { getCropById } from '../../data/crops';

export const SoilDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const soil = slug ? getSoilBySlug(slug) : undefined;

  if (!soil) {
    return (
      <div className="max-w-xl mx-auto my-12 border border-slate-200 bg-white rounded-xl p-8 text-center shadow-sm space-y-4">
        <div className="text-4xl">🌱</div>
        <h1 className="text-2xl font-bold text-slate-900">Soil Type Not Found</h1>
        <p className="text-sm text-slate-600">
          The requested soil profile <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 text-xs">/knowledge/soils/{slug}</code> does not exist in our agricultural catalog.
        </p>
        <div className="pt-2">
          <Link
            to="/knowledge/soils"
            className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-700 text-white font-medium text-sm hover:bg-emerald-800 transition"
          >
            ← Back to Soil Catalog
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
        <Link to="/knowledge/soils" className="hover:text-green-700">Soils</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">{soil.name}</span>
      </nav>

      {/* Hero Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start space-x-4">
            <span className="text-4xl sm:text-5xl p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              {soil.icon}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  Drainage: {soil.drainage}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Moisture: {soil.waterRetention}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{soil.name}</h1>
              <p className="text-xs text-slate-500 mt-1">
                Indian Agro-Climatic Soil Profile & Management Guide
              </p>
            </div>
          </div>

          <Link
            to="/knowledge/soils"
            className="self-start text-xs font-semibold px-3 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
          >
            ← Back to Catalog
          </Link>
        </div>

        <p className="mt-5 text-sm sm:text-base text-slate-700 leading-relaxed border-t border-slate-100 pt-4">
          {soil.shortDescription}
        </p>
      </div>

      {/* Physical & Nutrient Profile Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🔬</span>
            <span>Texture & Physical Characteristics</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {soil.textureCharacteristics}
          </p>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600">
            <p><strong className="text-slate-800">Drainage Behavior:</strong> {soil.drainage}</p>
            <p className="mt-1"><strong className="text-slate-800">Moisture Holding Capacity:</strong> {soil.waterRetention}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🧪</span>
            <span>Nutrient Dynamics & Retention</span>
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            {soil.nutrientRetention}
          </p>
        </div>
      </div>

      {/* Advantages and Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advantages */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-emerald-900 flex items-center space-x-2">
            <span>✨</span>
            <span>Agricultural Advantages</span>
          </h2>
          <ul className="text-xs text-slate-700 space-y-2">
            {soil.advantages.map((adv, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                <span className="leading-relaxed">{adv}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Challenges */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-amber-900 flex items-center space-x-2">
            <span>⚠️</span>
            <span>Management Challenges</span>
          </h2>
          <ul className="text-xs text-slate-700 space-y-2">
            {soil.challenges.map((chal, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-amber-600 font-bold mt-0.5">•</span>
                <span className="leading-relaxed">{chal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Soil Improvement & Regeneration Practices */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <span>🌿</span>
          <span>Soil Improvement & Long-Term Health Practices</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {soil.improvementPractices.map((practice, idx) => (
            <div
              key={idx}
              className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg text-xs text-emerald-950 space-y-1"
            >
              <div className="font-semibold text-emerald-800">Practice #{idx + 1}</div>
              <p className="leading-relaxed">{practice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compatible Indian Crops Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>🌾</span>
            <span>Crops Typically Well-Suited to {soil.name}</span>
          </h2>
          <span className="text-xs font-medium text-slate-500">
            {soil.suitableCropIds.length} Crops
          </span>
        </div>
        <p className="text-xs text-slate-600">
          Click any crop below to view comprehensive temperature, water, and agronomic management specifications:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {soil.suitableCropIds.map((cropId) => {
            const crop = getCropById(cropId);
            if (!crop) return null;
            return (
              <Link
                key={crop.id}
                to={`/knowledge/crops/${crop.slug}`}
                className="border border-slate-200 rounded-lg p-3 hover:border-green-400 hover:bg-green-50/50 transition group flex items-start space-x-3"
              >
                <span className="text-xl p-1.5 bg-slate-100 rounded-md group-hover:bg-green-100 transition">
                  {crop.icon}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-green-800 transition">
                    {crop.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {crop.seasons.join(', ')} Season
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Source References */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
        <h3 className="font-semibold text-slate-800 flex items-center space-x-1.5">
          <span>📚</span>
          <span>Institutional Research References</span>
        </h3>
        <ul className="space-y-1 list-disc list-inside">
          {soil.sources.map((src, idx) => (
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
        <strong>Agronomic Disclaimer:</strong> Soil texture alone does not guarantee whether a crop will succeed. Local soil pH, salinity/electrical conductivity, effective root depth, hardpans, drainage slopes, and irrigation water quality are equally decisive. Soil testing before seasonal sowing is strongly advised.
      </div>
    </div>
  );
};
