import React from 'react';
import { Link } from 'react-router-dom';
import { SOILS_DATA } from '../../data/soils';
import { getCropById } from '../../data/crops';

export const SoilCatalogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link to="/knowledge" className="hover:text-green-700">Knowledge Explorer</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Soils</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Soil Health & Classification Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Explore the physical textures, drainage behavior, nutrient retention, and improvement techniques for {SOILS_DATA.length} primary agricultural soils across India.
          </p>
        </div>
        <Link
          to="/knowledge/crops"
          className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition whitespace-nowrap"
        >
          View Crop Catalog →
        </Link>
      </div>

      {/* Soil Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SOILS_DATA.map((soil) => (
          <div
            key={soil.id}
            className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    <Link
                      to={`/knowledge/soils/${soil.slug}`}
                      className="hover:text-green-700 transition"
                    >
                      {soil.name}
                    </Link>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Drainage: <strong className="text-slate-700">{soil.drainage}</strong>
                  </p>
                </div>
                <span className="text-2xl p-2 bg-slate-50 border border-slate-200 rounded-lg">
                  {soil.icon}
                </span>
              </div>

              {/* Water Retention & Trait Badges */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                  Moisture: {soil.waterRetention}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                  {soil.suitableCropIds.length} Compatible Crops
                </span>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {soil.shortDescription}
              </p>

              {/* Physical Texture */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Texture Profile:
                </span>
                <p className="text-slate-700 line-clamp-2 leading-relaxed">
                  {soil.textureCharacteristics}
                </p>
              </div>

              {/* Compatible Crops Chips */}
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Common Suitable Crops:
                </span>
                <div className="flex flex-wrap gap-1">
                  {soil.suitableCropIds.map((cropId) => {
                    const crop = getCropById(cropId);
                    return crop ? (
                      <Link
                        key={crop.id}
                        to={`/knowledge/crops/${crop.slug}`}
                        className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition"
                      >
                        {crop.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Footer Link */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <Link
                to={`/knowledge/soils/${soil.slug}`}
                className="w-full inline-flex items-center justify-center text-xs font-semibold py-2 px-3 rounded-md bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition"
              >
                Explore Soil Characteristics →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Holistic Soil Advisory */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 text-xs text-slate-600 space-y-2">
        <h3 className="font-semibold text-slate-800 text-sm">
          💡 Soil Texture vs. Total Field Health
        </h3>
        <p className="leading-relaxed">
          While soil physical texture (the ratio of sand, silt, and clay) determines baseline drainage and aeration, successful crop production also depends heavily on <strong>soil organic carbon (SOC)</strong>, <strong>soil pH</strong>, <strong>salinity/alkalinity levels</strong>, and <strong>biological microbial activity</strong>. Regular soil testing under the Government of India’s Soil Health Card scheme is strongly recommended every two years.
        </p>
      </div>
    </div>
  );
};
