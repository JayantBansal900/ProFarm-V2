
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdvisorPage } from '../src/pages/AdvisorPage';
import { api, ApiError } from '../src/api/api';
import type { AdvisorData } from '../src/types/advisor';

vi.mock('../src/api/api', () => ({
  api: {
    getAdvisorRecommendations: vi.fn(),
    getAdvisorCrops: vi.fn(),
    getAdvisorSoils: vi.fn(),
    searchLocations: vi.fn(),
  },

  ApiError: class ApiError extends Error {
    constructor(
      public message: string,
      public statusCode: number
    ) {
      super(message);
      this.name = 'ApiError';
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
    textureCharacteristics:
      'Medium crumbly texture with 40% sand, 40% silt, 20% clay',
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
    reason:
      "Loamy Soil's drainage and moisture dynamics naturally align with Wheat's root structure.",
  },

  weatherSummary: {
    locationName: 'Ludhiana, Punjab',
    temperatureC: 22.5,
    apparentTemperatureC: 22.0,
    condition: 'Clear Sky',
    icon: '☀️',
    sevenDayTotalRainMm: 0,
    todayRainMm: 0,
    maxDailyPrecipProb: 5,
    maxWindSpeedKmH: 12,
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
        explanation:
          'Crucial irrigation stages include CRI (20–25 DAS) and tillering.',
        whyThisApplies:
          'Selected crop is Wheat (Triticum aestivum).',
        evidence: [
          'Crop: Wheat',
          'Water level: Moderate',
        ],
        limitations:
          'Stage timings vary based on cultivar variety.',
        source: {
          name:
            'ICAR - Indian Institute of Wheat and Barley Research (IIWBR)',
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
        explanation:
          'Drainage profile is categorized as Good / Well-Drained.',
        whyThisApplies:
          'Selected soil Loamy Soil directly controls root penetration.',
        evidence: [
          'Soil: Loamy Soil',
          'Drainage: Good / Well-Drained',
        ],
        limitations:
          'Soil texture is an inherent property.',
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
        explanation:
          'Requires 4–6 timed irrigations across the season.',
        whyThisApplies:
          'Wheat requires 450–650 mm water across its vegetative cycle.',
        evidence: ['Crop water tier: Moderate'],
        limitations:
          'Actual water volume needed varies with seasonal rainfall.',
        source: {
          name:
            'Central Research Institute for Dryland Agriculture (CRIDA)',
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
        explanation:
          'Adoption of Zero-Till (Happy Seeder) in paddy stubble fields.',
        whyThisApplies:
          'Curated sustainable practice specifically developed for Wheat.',
        evidence: [
          'Crop: Wheat',
          'Category: Cereal & Grain',
        ],
        limitations:
          'Equipment availability can affect implementation.',
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
        explanation:
          'Atmospheric conditions offer a steady window for intercultural operations.',
        whyThisApplies:
          'Low rainfall risk and moderate temperatures permit standard farm tasks.',
        evidence: [
          'Condition: Clear Sky',
          'Wind Speed: 12 km/h',
        ],
        limitations:
          'Keep daily track of sudden weather updates.',
        source: {
          name:
            'Agromet Field Unit Guidelines & IMD Weather Forecast',
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

function renderAdvisor() {
  render(
    <BrowserRouter>
      <AdvisorPage />
    </BrowserRouter>
  );
}

async function loadConfiguration() {
  await screen.findByRole('option', {
    name: 'Wheat',
  });

  expect(
    screen.getByRole('combobox', {
      name: /Crop/i,
    })
  ).toBeInTheDocument();

  expect(
    screen.getByRole('combobox', {
      name: /Soil profile/i,
    })
  ).toBeInTheDocument();
}

function clickGenerateGuidance() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /Generate field guidance/i,
    })
  );
}

async function generateGuidance() {
  await loadConfiguration();

  clickGenerateGuidance();

  await waitFor(() => {
    expect(
      api.getAdvisorRecommendations
    ).toHaveBeenCalled();
  });

  await screen.findByRole('heading', {
    name: 'Key Growth Stages & Care for Wheat',
  });
}

describe('Sustainable Farming Advisor Page (/tools/advisor)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.mocked(api.getAdvisorCrops).mockResolvedValue({
      status: 'success',
      count: 12,
      crops: [
        {
          id: 'crop-wheat',
          slug: 'wheat',
          name: 'Wheat',
          hindiName: 'गेहूं',
          category: 'Cereal & Grain',
          seasons: ['Rabi'],
          waterLevel: 'Moderate',
          icon: '🌾',
        },
        {
          id: 'crop-rice',
          slug: 'rice',
          name: 'Rice / Paddy',
          hindiName: 'चावल',
          category: 'Cereal & Grain',
          seasons: ['Kharif'],
          waterLevel: 'Very High',
          icon: '🍚',
        },
      ],
    });

    vi.mocked(api.getAdvisorSoils).mockResolvedValue({
      status: 'success',
      count: 6,
      soils: [
        {
          id: 'soil-loam',
          slug: 'loamy-soil',
          name: 'Loamy Soil',
          drainage: 'Good / Well-Drained',
          waterRetention: 'Moderate',
          icon: '🌾',
        },
        {
          id: 'soil-sandy',
          slug: 'sandy-soil',
          name: 'Sandy Soil',
          drainage: 'Rapid',
          waterRetention: 'Low',
          icon: '🏖️',
        },
      ],
    });

    vi.mocked(
      api.getAdvisorRecommendations
    ).mockResolvedValue({
      status: 'success',
      data: mockAdvisorData,
    });

    vi.mocked(api.searchLocations).mockResolvedValue({
      status: 'success',
      count: 0,
      locations: [],
    });
  });

  it('renders configuration and generates wheat guidance', async () => {
    renderAdvisor();

    expect(
      screen.getByRole('heading', {
        name: /Sustainable Farming Advisor/i,
      })
    ).toBeInTheDocument();

    await loadConfiguration();

    expect(
      screen.getByRole('checkbox', {
        name: /Include 7-day forecast/i,
      })
    ).toBeInTheDocument();

    await generateGuidance();

    for (const title of [
      'Key Growth Stages & Care for Wheat',
      'Soil Tilth & Moisture Dynamics (Loamy Soil)',
      'Irrigation Strategy: Moderate Demand',
      'Wheat Stewardship Practice #1',
    ]) {
      expect(
        screen.getByRole('heading', {
          name: title,
        })
      ).toBeInTheDocument();
    }
  });

  it('displays compatibility information for wheat and loamy soil', async () => {
    renderAdvisor();

    await generateGuidance();

    expect(
      screen.getByRole('heading', {
        name: /Highly Suitable: Wheat thrives in Loamy Soil/i,
      })
    ).toBeInTheDocument();
  });

  it('filters recommendations by category', async () => {
    renderAdvisor();

    await generateGuidance();

    const cropCareButton = screen.getByRole('button', {
      name: /^Crop care\s+1$/i,
    });

    fireEvent.click(cropCareButton);

    expect(cropCareButton).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    expect(
      screen.getByRole('heading', {
        name: 'Key Growth Stages & Care for Wheat',
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', {
        name: 'Irrigation Strategy: Moderate Demand',
      })
    ).not.toBeInTheDocument();

    const waterButton = screen.getByRole('button', {
      name: /^Water\s+1$/i,
    });

    fireEvent.click(waterButton);

    expect(waterButton).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    expect(
      screen.getByRole('heading', {
        name: 'Irrigation Strategy: Moderate Demand',
      })
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('heading', {
        name: 'Key Growth Stages & Care for Wheat',
      })
    ).not.toBeInTheDocument();
  });

  it('submits the selected crop when generating guidance', async () => {
    renderAdvisor();

    await loadConfiguration();

    fireEvent.change(
      screen.getByRole('combobox', {
        name: /Crop/i,
      }),
      {
        target: {
          value: 'crop-rice',
        },
      }
    );

    clickGenerateGuidance();

    await waitFor(() => {
      expect(
        api.getAdvisorRecommendations
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          cropId: 'crop-rice',
        })
      );
    });
  });

  it('supports generating guidance without a soil profile', async () => {
    renderAdvisor();

    await loadConfiguration();

    fireEvent.change(
      screen.getByRole('combobox', {
        name: /Soil profile/i,
      }),
      {
        target: {
          value: '',
        },
      }
    );

    clickGenerateGuidance();

    await waitFor(() => {
      expect(
        api.getAdvisorRecommendations
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          soilId: null,
        })
      );
    });
  });

  it('supports disabling the weather forecast integration', async () => {
    renderAdvisor();

    await loadConfiguration();

    const weatherCheckbox = screen.getByRole('checkbox', {
      name: /Include 7-day forecast/i,
    });

    expect(weatherCheckbox).toBeChecked();

    fireEvent.click(weatherCheckbox);

    expect(weatherCheckbox).not.toBeChecked();

    clickGenerateGuidance();

    await waitFor(() => {
      expect(
        api.getAdvisorRecommendations
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          location: null,
        })
      );
    });
  });

  it('expands recommendation reasoning and explainability details', async () => {
    renderAdvisor();

    await generateGuidance();

    const explanationButtons = screen.getAllByRole(
      'button',
      {
        name: /Why this matters/i,
      }
    );

    expect(explanationButtons).toHaveLength(5);

    const firstExplanationButton = explanationButtons[0];

    expect(firstExplanationButton).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    fireEvent.click(firstExplanationButton);

    expect(firstExplanationButton).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    expect(
      screen.getByText(
        /Selected crop is Wheat/i
      )
    ).toBeInTheDocument();
  });

  it('displays the educational disclaimer from the API response', async () => {
    renderAdvisor();

    await generateGuidance();

    expect(
      screen.getByText(
        /ProFarm Sustainable Advisor is an educational decision-support tool/i
      )
    ).toBeInTheDocument();
  });

  it('displays an API error and recovers after retry', async () => {
    renderAdvisor();

    // Allow initial page setup and any automatic
    // recommendation request to finish successfully.
    await loadConfiguration();

    await screen.findByRole('heading', {
      name: 'Key Growth Stages & Care for Wheat',
    });

    const initialCallCount = vi.mocked(
      api.getAdvisorRecommendations
    ).mock.calls.length;

    // Fail the NEXT explicitly generated request,
    // rather than an automatic request during mount.
    vi.mocked(
      api.getAdvisorRecommendations
    ).mockRejectedValueOnce(
      new ApiError(
        'Failed to communicate with advisory engine',
        500
      )
    );

    clickGenerateGuidance();

    await waitFor(() => {
      expect(
        api.getAdvisorRecommendations
      ).toHaveBeenCalledTimes(initialCallCount + 1);
    });

    expect(
      await screen.findByText(
        /Unable to generate guidance/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Failed to communicate with advisory engine/i
      )
    ).toBeInTheDocument();

    const retryButton = screen.getByRole('button', {
      name: /Retry/i,
    });

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(
        api.getAdvisorRecommendations
      ).toHaveBeenCalledTimes(initialCallCount + 2);
    });

    await waitFor(() => {
      expect(
        screen.queryByText(
          /Unable to generate guidance/i
        )
      ).not.toBeInTheDocument();
    });

    expect(
      await screen.findByRole('heading', {
        name: 'Key Growth Stages & Care for Wheat',
      })
    ).toBeInTheDocument();
  });

  it('allows searching for and selecting a location', async () => {
    vi.mocked(api.searchLocations).mockResolvedValue({
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

    renderAdvisor();

    await loadConfiguration();

    fireEvent.click(
      screen.getByRole('button', {
        name: /Set location|Change/i,
      })
    );

    expect(
      screen.getByRole('heading', {
        name: /Find your location/i,
      })
    ).toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', {
      name: /Search location/i,
    });

    fireEvent.change(searchInput, {
      target: {
        value: 'Karnal',
      },
    });

    expect(searchInput).toHaveValue('Karnal');

    fireEvent.click(
      screen.getByRole('button', {
        name: /^Search$/i,
      })
    );

    await waitFor(() => {
      expect(api.searchLocations).toHaveBeenCalled();
    });

    const locationResult = await screen.findByText(
      /Karnal, Haryana/i
    );

    fireEvent.click(locationResult);

    await waitFor(() => {
      expect(
        screen.getByText(/Karnal, Haryana/i)
      ).toBeInTheDocument();
    });
  });
});
