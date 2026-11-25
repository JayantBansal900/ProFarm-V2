
import type { RouteObject } from 'react-router-dom';

import { AppLayout } from './components/AppLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';

import {
  KnowledgePage,
  CropCatalogPage,
  CropDetailPage,
  SoilCatalogPage,
  SoilDetailPage,
} from './pages/KnowledgePage';

import { ToolsPage } from './pages/ToolsPage';
import { WeatherPage } from './pages/WeatherPage';
import { MandiPage } from './pages/MandiPage';
import { AdvisorPage } from './pages/AdvisorPage';

import { MyFarmsPage } from './pages/MyFarmsPage';
import { FarmDetailPage } from './pages/FarmDetailPage';
import { CalendarPage } from './pages/CalendarPage';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CreditsPage } from './pages/CreditsPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Public home page
      {
        index: true,
        element: <HomePage />,
      },

      // Protected dashboard
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },

      // Public Knowledge Explorer
      {
        path: 'knowledge',
        element: <KnowledgePage />,
      },
      {
        path: 'knowledge/crops',
        element: <CropCatalogPage />,
      },
      {
        path: 'knowledge/crops/:slug',
        element: <CropDetailPage />,
      },
      {
        path: 'knowledge/soils',
        element: <SoilCatalogPage />,
      },
      {
        path: 'knowledge/soils/:slug',
        element: <SoilDetailPage />,
      },

      // Public agricultural tools
      {
        path: 'tools',
        element: <ToolsPage />,
      },
      {
        path: 'tools/weather',
        element: <WeatherPage />,
      },
      {
        path: 'tools/mandi',
        element: <MandiPage />,
      },
      {
        path: 'tools/advisor',
        element: <AdvisorPage />,
      },

      // Protected farm management
      {
        path: 'my-farms',
        element: (
          <ProtectedRoute>
            <MyFarmsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-farms/calendar',
        element: (
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-farms/:farmId',
        element: (
          <ProtectedRoute>
            <FarmDetailPage />
          </ProtectedRoute>
        ),
      },

      // Authentication
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },

      {
        path: 'credits',
        element: <CreditsPage />,
      },

      // Fallback
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];
