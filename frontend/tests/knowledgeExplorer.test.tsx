import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { CropCatalogPage } from '../src/pages/knowledge/CropCatalogPage';
import { CropDetailPage } from '../src/pages/knowledge/CropDetailPage';
import { SoilCatalogPage } from '../src/pages/knowledge/SoilCatalogPage';
import { SoilDetailPage } from '../src/pages/knowledge/SoilDetailPage';

describe('Knowledge Explorer Components & User Interactions', () => {
  beforeEach(() => {
    // Reset any mocks if needed
  });

  describe('CropCatalogPage', () => {
    it('renders all 12 crops by default', () => {
      render(
        <BrowserRouter>
          <CropCatalogPage />
        </BrowserRouter>
      );

      expect(
        screen.getByRole('heading', { name: /Indian Crop Knowledge Catalog/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/of 12 crops/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Wheat/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Rice/i })).toBeInTheDocument();
    });

    it('filters crops by text search (English and Hindi names)', () => {
      render(
        <BrowserRouter>
          <CropCatalogPage />
        </BrowserRouter>
      );

      const searchInput = screen.getByLabelText(/Search Crops/i);

      // Search by English name
      fireEvent.change(searchInput, { target: { value: 'Mustard' } });
      expect(screen.getByRole('link', { name: /Mustard/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Rice/i })).not.toBeInTheDocument();

      // Search by Hindi name
      fireEvent.change(searchInput, { target: { value: 'गेहूं' } });
      expect(screen.getByRole('link', { name: /Wheat/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Mustard/i })).not.toBeInTheDocument();
    });

    it('filters crops by growing season', () => {
      render(
        <BrowserRouter>
          <CropCatalogPage />
        </BrowserRouter>
      );

      const seasonSelect = screen.getByLabelText(/Growing Season/i);

      // Select Rabi
      fireEvent.change(seasonSelect, { target: { value: 'Rabi' } });
      expect(screen.getByRole('link', { name: /Wheat/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Chickpea/i })).toBeInTheDocument();
      // Rice is primarily Kharif, should not appear under Rabi-only
      expect(screen.queryByRole('link', { name: /Rice/i })).not.toBeInTheDocument();
    });

    it('filters crops by suitable soil type', () => {
      render(
        <BrowserRouter>
          <CropCatalogPage />
        </BrowserRouter>
      );

      const soilSelect = screen.getByLabelText(/Suitable Soil Type/i);

      // Select Sandy Soil
      fireEvent.change(soilSelect, { target: { value: 'soil-sandy' } });
      expect(screen.getByRole('link', { name: /Pearl Millet/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Groundnut/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Sugarcane/i })).not.toBeInTheDocument();
    });

    it('clears active filters when Clear Filters button is clicked', () => {
      render(
        <BrowserRouter>
          <CropCatalogPage />
        </BrowserRouter>
      );

      const searchInput = screen.getByLabelText(/Search Crops/i);
      fireEvent.change(searchInput, { target: { value: 'Potato' } });
      expect(screen.getByRole('button', { name: /Clear Filters/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Clear Filters/i }));
      expect(searchInput).toHaveValue('');
      expect(screen.getByText(/of 12 crops/i)).toBeInTheDocument();
    });

    it('displays empty state when search finds no results and allows reset', () => {
      render(
        <BrowserRouter>
          <CropCatalogPage />
        </BrowserRouter>
      );

      const searchInput = screen.getByLabelText(/Search Crops/i);
      fireEvent.change(searchInput, { target: { value: 'NonExistentCrop123' } });

      expect(screen.getByRole('heading', { name: /No matching crops found/i })).toBeInTheDocument();
      const resetButton = screen.getByRole('button', { name: /Reset All Filters/i });
      expect(resetButton).toBeInTheDocument();

      fireEvent.click(resetButton);
      expect(screen.getByRole('link', { name: /Wheat/i })).toBeInTheDocument();
    });
  });

  describe('CropDetailPage', () => {
    it('renders crop details correctly for a valid slug', () => {
      render(
        <MemoryRouter initialEntries={['/knowledge/crops/wheat']}>
          <Routes>
            <Route path="/knowledge/crops/:slug" element={<CropDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /^Wheat$/i })).toBeInTheDocument();
      expect(screen.getByText(/Triticum aestivum/i)).toBeInTheDocument();
      expect(screen.getByText(/गेहूं \(Gehun\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Crown Root Initiation/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Loamy Soil/i })).toBeInTheDocument();
    });

    it('displays not-found message gracefully for an invalid crop slug', () => {
      render(
        <MemoryRouter initialEntries={['/knowledge/crops/invalid-banana-slug']}>
          <Routes>
            <Route path="/knowledge/crops/:slug" element={<CropDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Crop Not Found/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Crop Catalog/i })).toBeInTheDocument();
    });
  });

  describe('SoilCatalogPage', () => {
    it('renders all 6 soil types with details and compatible crop links', () => {
      render(
        <BrowserRouter>
          <SoilCatalogPage />
        </BrowserRouter>
      );

      expect(
        screen.getByRole('heading', { name: /Soil Health & Classification Catalog/i })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Loamy Soil/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Clay Soil/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sandy Soil/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Silty Soil/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sandy Loam Soil/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Clay Loam Soil/i })).toBeInTheDocument();
    });
  });

  describe('SoilDetailPage', () => {
    it('renders soil details correctly for a valid slug', () => {
      render(
        <MemoryRouter initialEntries={['/knowledge/soils/clay-soil']}>
          <Routes>
            <Route path="/knowledge/soils/:slug" element={<SoilDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /^Clay Soil$/i })).toBeInTheDocument();
      expect(screen.getByText(/Drainage: Slow \/ Poor/i)).toBeInTheDocument();
      expect(screen.getByText(/Moisture: Very High/i)).toBeInTheDocument();
      expect(screen.getByText(/Agricultural Advantages/i)).toBeInTheDocument();
      expect(screen.getByText(/Management Challenges/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Rice/i })).toBeInTheDocument();
    });

    it('displays not-found message gracefully for an invalid soil slug', () => {
      render(
        <MemoryRouter initialEntries={['/knowledge/soils/moon-dust-soil']}>
          <Routes>
            <Route path="/knowledge/soils/:slug" element={<SoilDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: /Soil Type Not Found/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Soil Catalog/i })).toBeInTheDocument();
    });
  });
});
