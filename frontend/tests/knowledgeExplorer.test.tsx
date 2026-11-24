
import { describe, it, expect } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  within,
} from '@testing-library/react';
import {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
} from 'react-router-dom';

import { CropCatalogPage } from '../src/pages/CropCatalogPage';
import { CropDetailPage } from '../src/pages/CropDetailPage';
import { SoilCatalogPage } from '../src/pages/SoilCatalogPage';
import { SoilDetailPage } from '../src/pages/SoilDetailPage';

function renderCropCatalog() {
  return render(
    <BrowserRouter>
      <CropCatalogPage />
    </BrowserRouter>
  );
}

function renderSoilCatalog() {
  return render(
    <BrowserRouter>
      <SoilCatalogPage />
    </BrowserRouter>
  );
}

function renderCropDetail(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/knowledge/crops/${slug}`]}>
      <Routes>
        <Route
          path="/knowledge/crops/:slug"
          element={<CropDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function renderSoilDetail(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/knowledge/soils/${slug}`]}>
      <Routes>
        <Route
          path="/knowledge/soils/:slug"
          element={<SoilDetailPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function getCropCatalog() {
  return screen.getByRole('region', {
    name: 'Crop catalog',
  });
}

function getSoilCatalog() {
  return screen.getByRole('region', {
    name: 'Soil catalog',
  });
}

describe('Knowledge Explorer Components & User Interactions', () => {
  describe('CropCatalogPage', () => {
    it('renders all 12 crops by default', () => {
      renderCropCatalog();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Explore Crops/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText(/of 12 crops/i)
      ).toBeInTheDocument();

      const catalog = getCropCatalog();

      expect(
        within(catalog).getAllByRole('link')
      ).toHaveLength(12);

      expect(
        within(catalog).getByRole('link', {
          name: /Wheat/i,
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/crops/wheat'
      );

      expect(
        within(catalog).getByRole('link', {
          name: /Rice/i,
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/crops/rice'
      );
    });

    it('filters crops by text search (English and Hindi names)', () => {
      renderCropCatalog();

      const searchInput = screen.getByRole('searchbox', {
        name: /Search crops/i,
      });

      // English-name search.
      fireEvent.change(searchInput, {
        target: { value: 'Mustard' },
      });

      let catalog = getCropCatalog();

      expect(
        within(catalog).getByRole('link', {
          name: /Mustard/i,
        })
      ).toBeInTheDocument();

      expect(
        within(catalog).queryByRole('link', {
          name: /Rice/i,
        })
      ).not.toBeInTheDocument();

      // Hindi-name search.
      fireEvent.change(searchInput, {
        target: { value: 'गेहूं' },
      });

      catalog = getCropCatalog();

      expect(
        within(catalog).getByRole('link', {
          name: /Wheat/i,
        })
      ).toBeInTheDocument();

      expect(
        within(catalog).queryByRole('link', {
          name: /Mustard/i,
        })
      ).not.toBeInTheDocument();

      expect(searchInput).toHaveValue('गेहूं');
    });

    it('filters crops by growing season', () => {
      renderCropCatalog();

      const seasonSelect = screen.getByRole('combobox', {
        name: /Growing season/i,
      });

      fireEvent.change(seasonSelect, {
        target: { value: 'Rabi' },
      });

      expect(seasonSelect).toHaveValue('Rabi');

      const catalog = getCropCatalog();

      expect(
        within(catalog).getByRole('link', {
          name: /Wheat/i,
        })
      ).toBeInTheDocument();

      expect(
        within(catalog).getByRole('link', {
          name: /Chickpea/i,
        })
      ).toBeInTheDocument();

      expect(
        within(catalog).queryByRole('link', {
          name: /Rice/i,
        })
      ).not.toBeInTheDocument();
    });

    it('filters crops by suitable soil type', () => {
      renderCropCatalog();

      const soilSelect = screen.getByRole('combobox', {
        name: /Soil type/i,
      });

      fireEvent.change(soilSelect, {
        target: { value: 'soil-sandy' },
      });

      expect(soilSelect).toHaveValue('soil-sandy');

      const catalog = getCropCatalog();

      expect(
        within(catalog).getByRole('link', {
          name: /Pearl Millet/i,
        })
      ).toBeInTheDocument();

      expect(
        within(catalog).getByRole('link', {
          name: /Groundnut/i,
        })
      ).toBeInTheDocument();

      expect(
        within(catalog).queryByRole('link', {
          name: /Sugarcane/i,
        })
      ).not.toBeInTheDocument();
    });

    it('clears active filters when Clear Filters button is clicked', () => {
      renderCropCatalog();

      const searchInput = screen.getByRole('searchbox', {
        name: /Search crops/i,
      });

      fireEvent.change(searchInput, {
        target: { value: 'Potato' },
      });

      expect(searchInput).toHaveValue('Potato');

      const clearButton = screen.getByRole('button', {
        name: /Clear filters/i,
      });

      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');

      expect(
        screen.getByText(/of 12 crops/i)
      ).toBeInTheDocument();

      expect(
        within(getCropCatalog()).getAllByRole('link')
      ).toHaveLength(12);

      expect(
        screen.queryByRole('button', {
          name: /Clear filters/i,
        })
      ).not.toBeInTheDocument();
    });

    it('displays empty state when search finds no results and allows reset', () => {
      renderCropCatalog();

      const searchInput = screen.getByRole('searchbox', {
        name: /Search crops/i,
      });

      fireEvent.change(searchInput, {
        target: { value: 'NonExistentCrop123' },
      });

      expect(
        screen.getByRole('heading', {
          name: /No crops found/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.queryByRole('region', {
          name: 'Crop catalog',
        })
      ).not.toBeInTheDocument();

      const resetButton = screen.getByRole('button', {
        name: /^Reset filters$/i,
      });

      fireEvent.click(resetButton);

      expect(searchInput).toHaveValue('');

      expect(
        within(getCropCatalog()).getByRole('link', {
          name: /Wheat/i,
        })
      ).toBeInTheDocument();

      expect(
        within(getCropCatalog()).getAllByRole('link')
      ).toHaveLength(12);
    });
  });

  describe('CropDetailPage', () => {
    it('renders crop details correctly for a valid slug', () => {
      renderCropDetail('wheat');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /^Wheat\s*\.$/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText(/Triticum aestivum/i)
      ).toBeInTheDocument();

      expect(
        screen.getByText(/गेहूं/i)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', {
          name: /From seed to harvest/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('heading', {
          name: /Suitable Soils/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', {
          name: 'Soil Preparation',
        })
      ).toHaveAttribute('aria-expanded', 'true');

      const irrigationButton = screen.getByRole('button', {
        name: 'Irrigation Management',
      });

      expect(irrigationButton).toHaveAttribute(
        'aria-expanded',
        'false'
      );

      fireEvent.click(irrigationButton);

      expect(irrigationButton).toHaveAttribute(
        'aria-expanded',
        'true'
      );

      expect(
        screen.getByRole('link', {
          name: /Loamy Soil/i,
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/soils/loamy-soil'
      );
    });

    it('displays not-found message gracefully for an invalid crop slug', () => {
      renderCropDetail('invalid-banana-slug');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Crop not found/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /This crop is not in our catalog/i
        )
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', {
          name: /Back to Crops/i,
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/crops'
      );
    });
  });

  describe('SoilCatalogPage', () => {
    it('renders all 6 soil types with details and compatible crop links', () => {
      renderSoilCatalog();

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Explore Soils/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText(/6\s+Soil Types/i)
      ).toBeInTheDocument();

      const catalog = getSoilCatalog();

      expect(
        within(catalog).getAllByRole('article')
      ).toHaveLength(6);

      const soilNames = [
        'Loamy Soil',
        'Clay Soil',
        'Sandy Soil',
        'Silty Soil',
        'Sandy Loam Soil',
        'Clay Loam Soil',
      ];

      for (const soilName of soilNames) {
        expect(
          within(catalog).getByRole('heading', {
            level: 2,
            name: soilName,
          })
        ).toBeInTheDocument();
      }

      expect(
        screen.getByRole('link', {
          name: 'Explore Loamy Soil',
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/soils/loamy-soil'
      );

      expect(
        screen.getByRole('link', {
          name: 'Explore Clay Loam Soil',
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/soils/clay-loam-soil'
      );
    });
  });

  describe('SoilDetailPage', () => {
    it('renders soil details correctly for a valid slug', () => {
      renderSoilDetail('clay-soil');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /^Clay Soil\s*\.$/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getAllByText(/Slow \/ Poor/i).length
      ).toBeGreaterThanOrEqual(1);

      expect(
        screen.getAllByText(/Very High/i).length
      ).toBeGreaterThanOrEqual(1);

      const advantagesButton = screen.getByRole('button', {
        name: 'Agricultural Advantages',
      });

      const challengesButton = screen.getByRole('button', {
        name: 'Management Challenges',
      });

      expect(advantagesButton).toHaveAttribute(
        'aria-expanded',
        'true'
      );

      expect(challengesButton).toHaveAttribute(
        'aria-expanded',
        'false'
      );

      fireEvent.click(challengesButton);

      expect(challengesButton).toHaveAttribute(
        'aria-expanded',
        'true'
      );

      expect(
        screen.getByRole('heading', {
          name: /Suitable Crops/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', {
          name: /^Rice\b/i,
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/crops/rice'
      );
    });

    it('displays not-found message gracefully for an invalid soil slug', () => {
      renderSoilDetail('moon-dust-soil');

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Soil not found/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /This soil profile is not available in our catalog/i
        )
      ).toBeInTheDocument();

      expect(
        screen.getByRole('link', {
          name: /Back to Soils/i,
        })
      ).toHaveAttribute(
        'href',
        '/knowledge/soils'
      );
    });
  });
});
