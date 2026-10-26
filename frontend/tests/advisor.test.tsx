import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdvisorPage } from '../src/pages/tools/AdvisorPage';
import { api, ApiError } from '../src/services/api';
import { AdvisorData } from '../src/types/advisor';

// Mock API service
vi.mock('../src/services/api', () => ({
  api: {
    getAdvisorRecommendations: vi.fn(),
    getAdvisorCrops: vi.fn(),
    getAdvisorSoils: vi.fn(),
    searchLocations: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    constructor(public message: string, public statusCode: number) {
      super(message);
    }
  },
}));

const mockAdvisorData: AdvisorData = {
  crop: {
    id: 'crop-wheat',
    slug: 'wheat',
    name: 'Wheat',
    hindiName: 'गेहूं',
    scientificName: 'Triticum aestivum',
    category: 'Cereal & Grain',
    seasons: ['Rabi'],
    waterRequirement: {
      level: 'Moderate',
      annualMm: '450–650 mm',
    },
    temperatureRange: {
      minC: 10,
      maxC: 25,
    },
    icon: '🌾',
    colorTheme: 'amber',
  },
  soil: {
    id: 'soil-loam',
    slug: 'loamy-soil',
    name: 'Loamy Soil',
    textureCharacteristics: 'Medium crumbly texture with 40% sand, 40% silt, 20% clay',
    drainage: 'Good / Well-Drained',
    waterRetention: 'Moderate',
    nutrientRetention: 'High cation exchange capacity',
    icon: '🌾',
    colorTheme: 'amber',
  },
  compatibility: {
    isCompatible: true,
    status: 'recommended',
    headline: 'Highly Suitable: Wheat thrives in Loamy Soil',
    reason: "Loamy Soil's drainage and moisture dynamics naturally align with Wheat's root structure.",
  },
  weatherSummary: {
    locationName: 'Ludhiana, Punjab',
    temperatureC: 22.5,
    apparentTemperatureC: 22.0,
    condition: 'Clear Sky',
    icon: '☀️',
    sevenDayTotalRainMm: 0.0,
    todayRainMm: 0.0,
    maxDailyPrecipProb: 5,
    maxWindSpeedKmH: 12.0,
    heavyRainAlert: false,
    drySpellAlert: true,
    heatStressAlert: false,
    fetchedAt: '2026-10-26T12:00:00Z',
  },
  recommendations: {
    cropCare: [
      {
        id: 'crop-care-stages-crop-wheat',
        category: 'crop_care',
        priority: 'high',
        title: 'Key Growth Stages & Care for Wheat',
        explanation: 'Crucial irrigation stages include CRI (20–25 DAS) and tillering.',
        whyThisApplies: 'Selected crop is Wheat (Triticum aestivum).',
        evidence: ['Crop: Wheat', 'Water level: Moderate'],
        limitations: 'Stage timings vary based on cultivar variety.',
        source: {
          name: 'ICAR - Indian Institute of Wheat and Barley Research (IIWBR)',
          organization: 'ICAR-IIWBR, Karnal',
        },
      },
    ],
    soilHealth: [
      {
        id: 'soil-health-texture-soil-loam',
        category: 'soil_health',
        priority: 'high',
        title: 'Soil Tilth & Moisture Dynamics (Loamy Soil)',
        explanation: 'Drainage profile is categorized as Good / Well-Drained.',
        whyThisApplies: 'Selected soil Loamy Soil directly controls root penetration.',
        evidence: ['Soil: Loamy Soil', 'Drainage: Good / Well-Drained'],
        limitations: 'Soil texture is an inherent property.',
        source: {
          name: 'ICAR - Indian Institute of Soil Science',
          organization: 'ICAR, Bhopal',
        },
      },
    ],
    waterManagement: [
      {
        id: 'water-baseline-crop-wheat',
        category: 'water_management',
        priority: 'high',
        title: 'Irrigation Strategy: Moderate Demand',
        explanation: 'Requires 4–6 timed irrigations across the season.',
        whyThisApplies: 'Wheat requires 450–650 mm water across its vegetative cycle.',
        evidence: ['Crop water tier: Moderate'],
        limitations: 'Actual water volume needed varies with seasonal rainfall.',
        source: {
          name: 'Central Research Institute for Dryland Agriculture (CRIDA)',
          organization: 'CRIDA, Hyderabad',
        },
      },
    ],
    sustainablePractices: [
      {
        id: 'practice-crop-wheat-1',
        category: 'sustainable_practices',
        priority: 'high',
        title: 'Wheat Stewardship Practice #1',
        explanation: 'Adoption of Zero-Till (Happy Seeder) in paddy stubble fields.',
        whyThisApplies: 'Curated sustainable practice specifically developed for Wheat.',
        evidence: ['Crop: Wheat', 'Category: Cereal & Grain'],
        limitations: 'Equipment availability can affect implementation.',
        source: {
          name: 'ICAR - IIWBR',
          organization: 'ICAR, New Delhi',
        },
      },
    ],
    weatherConsiderations: [
      {
        id: 'weather-field-operations-crop-wheat',
        category: 'weather_considerations',
        priority: 'info',
        title: 'Favorable Field Operations Window',
        explanation: 'Atmospheric conditions offer a steady window for intercultural operations.',
        whyThisApplies: 'Low rainfall risk and moderate temperatures permit standard farm tasks.',
        evidence: ['Condition: Clear Sky', 'Wind Speed: 12 km/h'],
        limitations: 'Keep daily track of sudden weather updates.',
        source: {
          name: 'Agromet Field Unit Guidelines & IMD Weather Forecast',
          organization: 'IMD / Open-Meteo',
        },
      },
    ],
  },
  summary: {
    totalRecommendations: 5,
    highPriorityCount: 4,
    soilIncluded: true,
    weatherIncluded: true,
  },
  disclaimer:
    'ProFarm Sustainable Advisor is an educational decision-support tool synthesized from published Indian agronomic research.',
  generatedAt: '2026-10-26T12:00:00Z',
};

describe('Sustainable Farming Advisor Page (/tools/advisor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(api.getAdvisorCrops).mockResolvedValue({
      status: 'success',
      count: 12,
      crops: [
        { id: 'crop-wheat', slug: 'wheat', name: 'Wheat', hindiName: 'गेहूं', category: 'Cereal & Grain', seasons: ['Rabi'], waterLevel: 'Moderate', icon: '🌾' },
        { id: 'crop-rice', slug: 'rice', name: 'Rice / Paddy', hindiName: 'चावल', category: 'Cereal & Grain', seasons: ['Kharif'], waterLevel: 'Very High', icon: '🍚' },
      ],
    });

    vi.mocked(api.getAdvisorSoils).mockResolvedValue({
      status: 'success',
      count: 6,
      soils: [
        { id: 'soil-loam', slug: 'loamy-soil', name: 'Loamy Soil', drainage: 'Good / Well-Drained', waterRetention: 'Moderate', icon: '🌾' },
        { id: 'soil-sandy', slug: 'sandy-soil', name: 'Sandy Soil', drainage: 'Rapid', waterRetention: 'Low', icon: '🏖️' },
      ],
    });

    vi.mocked(api.getAdvisorRecommendations).mockResolvedValue({
      status: 'success',
      data: mockAdvisorData,
    });
  });

  it('renders page header, parameter configuration form, and default wheat guidance', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /Sustainable Farming Advisor/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Crop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Select Soil Profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Integrate Live 7-Day Forecast/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
      expect(screen.getByText(/Soil Tilth & Moisture Dynamics \(Loamy Soil\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Irrigation Strategy: Moderate Demand/i)).toBeInTheDocument();
      expect(screen.getByText(/Wheat Stewardship Practice #1/i)).toBeInTheDocument();
    });
  });

  it('displays compatibility banner for compatible crop-soil match', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Highly Suitable: Wheat thrives in Loamy Soil/i)).toBeInTheDocument();
    });
  });

  it('filters recommendations when category tabs are clicked', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    });

    // Click 'Crop Care' filter tab
    const cropCareTab = screen.getByRole('button', { name: /Crop Care \(1\)/i });
    fireEvent.click(cropCareTab);

    expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    expect(screen.queryByText(/Soil Tilth & Moisture Dynamics \(Loamy Soil\)/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Irrigation Strategy: Moderate Demand/i)).not.toBeInTheDocument();

    // Click 'Water Management' filter tab
    const waterTab = screen.getByRole('button', { name: /Water Management \(1\)/i });
    fireEvent.click(waterTab);

    expect(screen.getByText(/Irrigation Strategy: Moderate Demand/i)).toBeInTheDocument();
    expect(screen.queryByText(/Key Growth Stages & Care for Wheat/i)).not.toBeInTheDocument();
  });

  it('allows changing crop selection and generating updated guidance', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    });

    // Change crop to Rice
    const cropSelect = screen.getByLabelText(/Select Crop/i);
    fireEvent.change(cropSelect, { target: { value: 'crop-rice' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Generate Sustainable Guidance/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.getAdvisorRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ cropId: 'crop-rice' })
      );
    });
  });

  it('allows skipping soil profile and updates request accordingly', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    });

    // Change soil to None
    const soilSelect = screen.getByLabelText(/Select Soil Profile/i);
    fireEvent.change(soilSelect, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /Generate Sustainable Guidance/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.getAdvisorRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ soilId: null })
      );
    });
  });

  it('allows toggling weather integration off', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    });

    const weatherCheckbox = screen.getByLabelText(/Integrate Live 7-Day Forecast/i);
    fireEvent.click(weatherCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Generate Sustainable Guidance/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.getAdvisorRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({ location: null })
      );
    });
  });

  it('displays explainability items on cards: Why this applies, Evidence, and Source', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Why this applies:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Agronomic Evidence:/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Source:/i).length).toBeGreaterThan(0);
    });
  });

  it('displays the educational disclaimer banner', async () => {
    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Educational Decision-Support Standard & Non-Commercial Guarantee/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/ProFarm Sustainable Advisor is an educational decision-support tool/i)
      ).toBeInTheDocument();
    });
  });

  it('displays error message and allows retry on API failure', async () => {
    vi.mocked(api.getAdvisorRecommendations).mockRejectedValueOnce(
      new ApiError('Failed to communicate with advisory engine', 500)
    );

    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Advisory Engine Error/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Failed to communicate with advisory engine/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    // Mock successful recovery on retry
    vi.mocked(api.getAdvisorRecommendations).mockResolvedValueOnce({
      status: 'success',
      data: mockAdvisorData,
    });

    fireEvent.click(screen.getByRole('button', { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    });
  });

  it('allows searching and picking a location when Set Location is clicked', async () => {
    vi.mocked(api.searchLocations).mockResolvedValueOnce({
      status: 'success',
      count: 1,
      locations: [
        {
          id: 999,
          name: 'Karnal',
          latitude: 29.68,
          longitude: 76.99,
          country: 'India',
          state: 'Haryana',
          timezone: 'Asia/Kolkata',
        },
      ],
    });

    render(
      <BrowserRouter>
        <AdvisorPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Key Growth Stages & Care for Wheat/i)).toBeInTheDocument();
    });

    // Click Set Location / Change button
    const changeBtn = screen.getByRole('button', { name: /Set Location|Change/i });
    fireEvent.click(changeBtn);

    const searchInput = screen.getByPlaceholderText(/e.g., Ludhiana, Guntur, Karnal, Nagpur/i);
    fireEvent.change(searchInput, { target: { value: 'Karnal' } });

    const searchBtn = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Karnal, Haryana/i)).toBeInTheDocument();
    });

    // Pick Karnal
    fireEvent.click(screen.getByText(/Karnal, Haryana/i));

    // Confirm Karnal selected in chip / display
    expect(screen.getByText(/📍 Karnal, Haryana/i)).toBeInTheDocument();
  });
});
