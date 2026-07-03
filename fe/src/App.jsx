import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppShell from './components/layout/AppShell';
import Spinner from './components/common/Spinner';
import Toast from './components/common/Toast';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const CreateTransactionPage = lazy(() => import('./pages/CreateTransactionPage'));
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'));
const CreateBudgetPage = lazy(() => import('./pages/CreateBudgetPage'));
const QuickCapturePage = lazy(() => import('./pages/QuickCapturePage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'transactions',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <TransactionsPage />
          </Suspense>
        ),
      },
      {
        path: 'transactions/new',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CreateTransactionPage />
          </Suspense>
        ),
      },
      {
        path: 'budgets',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <BudgetsPage />
          </Suspense>
        ),
      },
      {
        path: 'budgets/new',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CreateBudgetPage />
          </Suspense>
        ),
      },
      {
        path: 'capture',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <QuickCapturePage />
          </Suspense>
        ),
      },
      {
        path: 'categories',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <CategoriesPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

function LoadingFallback() {
  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
        <Toast />
      </ToastProvider>
    </AuthProvider>
  );
}
