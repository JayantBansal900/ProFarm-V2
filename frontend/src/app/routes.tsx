import { RouteObject } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import {
  KnowledgePage,
  CropCatalogPage,
  CropDetailPage,
  SoilCatalogPage,
  SoilDetailPage,
} from '../pages/KnowledgePage';
import { ToolsPage } from '../pages/ToolsPage';
import { WeatherPage } from '../pages/tools/WeatherPage';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      // Public Knowledge Explorer Routes
      { path: 'knowledge', element: <KnowledgePage /> },
      { path: 'knowledge/crops', element: <CropCatalogPage /> },
      { path: 'knowledge/crops/:slug', element: <CropDetailPage /> },
      { path: 'knowledge/soils', element: <SoilCatalogPage /> },
      { path: 'knowledge/soils/:slug', element: <SoilDetailPage /> },

      { path: 'tools', element: <ToolsPage /> },
      { path: 'tools/weather', element: <WeatherPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
