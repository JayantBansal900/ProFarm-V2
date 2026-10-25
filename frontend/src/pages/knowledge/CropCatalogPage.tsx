import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CROPS_DATA } from '../../data/crops';
import { SOILS_DATA, getSoilById } from '../../data/soils';
import { GrowingSeason, CropCategory } from '../../types/agriculture';

export const CropCatalogPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedSoilId, setSelectedSoilId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCrops = useMemo(() => {
    return CROPS_DATA.filter((crop) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = crop.name.toLowerCase().includes(query);
        const matchesHindi = crop.hindiName?.toLowerCase().includes(query) ?? false;
        const matchesScientific = crop.scientificName.toLowerCase().includes(query);
        const matchesDesc = crop.shortDescription.toLowerCase().includes(query);
        if (!matchesName && !matchesHindi && !matchesScientific && !matchesDesc) {
          return false;
        }
      }

      // 2. Season Filter
      if (selectedSeason !== 'all') {
        if (!crop.seasons.includes(selectedSeason as GrowingSeason)) {
          return false;
        }
      }

      // 3. Soil Filter
      if (selectedSoilId !== 'all') {
        if (!crop.suitableSoilIds.includes(selectedSoilId)) {
          return false;
        }
      }

      // 4. Category Filter
      if (selectedCategory !== 'all') {
        if (crop.category !== (selectedCategory as CropCategory)) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, selectedSeason, selectedSoilId, selectedCategory]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSeason !== 'all' ||
    selectedSoilId !== 'all' ||
    selectedCategory !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSeason('all');
    setSelectedSoilId('all');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center space-x-2">
        <Link to="/" className="hover:text-green-700">Home</Link>
        <span>/</span>
        <Link to="/knowledge" className="hover:text-green-700">Knowledge Explorer</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Crops</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Indian Crop Knowledge Catalog
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Explore climate tolerances, sowing cycles, and sustainable practices for {CROPS_DATA.length} major Indian agricultural crops.
          </p>
        </div>
        <Link
          to="/knowledge/soils"
          className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition whitespace-nowrap"
        >
          View Soil Catalog →
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div>
            <label htmlFor="crop-search" className="block text-xs font-semibold text-slate-700 mb-1">
              Search Crops
            </label>
            <input
              id="crop-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. Wheat, गेहूं, Cicer..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Season Filter */}
          <div>
            <label htmlFor="season-filter" className="block text-xs font-semibold text-slate-700 mb-1">
              Growing Season
            </label>
            <select
              id="season-filter"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Seasons</option>
              <option value="Kharif">Kharif (Monsoon)</option>
              <option value="Rabi">Rabi (Winter)</option>
              <option value="Zaid">Zaid (Summer)</option>
            </select>
          </div>

          {/* Soil Suitability Filter */}
          <div>
            <label htmlFor="soil-filter" className="block text-xs font-semibold text-slate-700 mb-1">
              Suitable Soil Type
            </label>
            <select
              id="soil-filter"
              value={selectedSoilId}
              onChange={(e) => setSelectedSoilId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Soil Types</option>
              {SOILS_DATA.map((soil) => (
                <option key={soil.id} value={soil.id}>
                  {soil.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label htmlFor="category-filter" className="block text-xs font-semibold text-slate-700 mb-1">
              Crop Category
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="Cereal & Grain">Cereals & Grains</option>
              <option value="Pulse & Legume">Pulses & Legumes</option>
              <option value="Oilseed">Oilseeds</option>
              <option value="Fiber">Fiber Crops</option>
              <option value="Commercial & Cash">Commercial & Cash</option>
              <option value="Tuber & Root">Tubers & Roots</option>
            </select>
          </div>
        </div>

        {/* Results Bar and Clear Filters */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-600 font-medium">
            Showing <strong className="text-slate-900">{filteredCrops.length}</strong> of {CROPS_DATA.length} crops
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-green-700 font-semibold hover:text-green-900 hover:underline flex items-center space-x-1"
            >
              <span>✕</span>
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Crops Grid */}
      {filteredCrops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <div
              key={crop.id}
              className="border border-slate-200 bg-white rounded-xl p-5 shadow-sm hover:shadow-md hover:border-green-300 transition flex flex-col justify-between"
            >
              <div>
                {/* Card Header with Icon, Name & Hindi */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      <Link
                        to={`/knowledge/crops/${crop.slug}`}
                        className="hover:text-green-700 transition"
                      >
                        {crop.name}
                      </Link>
                    </h2>
                    {crop.hindiName && (
                      <p className="text-xs text-slate-500 font-medium">{crop.hindiName}</p>
                    )}
                    <p className="text-xs italic text-slate-400 font-serif mt-0.5">
                      {crop.scientificName}
                    </p>
                  </div>
                  <span className="text-2xl p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    {crop.icon}
                  </span>
                </div>

                {/* Season & Category Badges */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {crop.seasons.map((season) => (
                    <span
                      key={season}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                    >
                      {season}
                    </span>
                  ))}
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {crop.category}
                  </span>
                </div>

                {/* Short Description */}
                <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {crop.shortDescription}
                </p>

                {/* Agronomic Snapshot */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Water Demand:</span>
                    <span className="font-medium text-slate-800">{crop.waterRequirement.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Temp Range:</span>
                    <span className="font-medium text-slate-800">
                      {crop.temperatureRange.minC}°C – {crop.temperatureRange.maxC}°C
                    </span>
                  </div>
                </div>

                {/* Suitable Soils Chips */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Suitable Soils:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {crop.suitableSoilIds.map((soilId) => {
                      const soil = getSoilById(soilId);
                      return soil ? (
                        <Link
                          key={soil.id}
                          to={`/knowledge/soils/${soil.slug}`}
                          className="text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition"
                        >
                          {soil.name}
                        </Link>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  to={`/knowledge/crops/${crop.slug}`}
                  className="w-full inline-flex items-center justify-center text-xs font-semibold py-2 px-3 rounded-md bg-green-50 text-green-800 hover:bg-green-100 transition"
                >
                  View Agronomic Guide →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center bg-white space-y-3">
          <div className="text-3xl">🔍</div>
          <h2 className="text-lg font-bold text-slate-800">No matching crops found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            We couldn’t find any crops matching your current search and filter settings. Try adjusting the season, soil type, or search terms.
          </p>
          <div>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-semibold px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
