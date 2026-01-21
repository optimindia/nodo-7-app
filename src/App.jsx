import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import BlockedAccount from './pages/BlockedAccount'; // Import Blocked Screen
import { useState, lazy, Suspense } from 'react';
import LoadingFallback from './components/LoadingFallback';

import DashboardLayout from './components/dashboard/DashboardLayout';

// Lazy load dashboard pages for better performance
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Wallets = lazy(() => import('./pages/dashboard/Wallets'));
const Analytics = lazy(() => import('./pages/dashboard/Analytics'));
const Goals = lazy(() => import('./pages/dashboard/Goals'));
const AIChat = lazy(() => import('./pages/dashboard/AIChat'));
const Categories = lazy(() => import('./pages/dashboard/Categories'));
const Debts = lazy(() => import('./pages/dashboard/Debts'));
const Budgets = lazy(() => import('./pages/dashboard/Budgets')); // Added Budgets lazy import
const UserSetupWizard = lazy(() => import('./pages/UserSetupWizard'));

const AppContent = () => {
  const { session, isBlocked, hasCompletedSetup } = useAuth(); // Destructure hasCompletedSetup
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // Simple routing state

  // Priority 1: If Blocked, show Blocked Screen
  if (isBlocked) {
    return <BlockedAccount />;
  }

  // Priority 2: Setup Wizard (Logged in but setup not complete)
  // Ensure we check strict false (it defaults to true initially in context until loaded, so it won't flash)
  if (session && hasCompletedSetup === false) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <UserSetupWizard onComplete={() => window.location.reload()} />
      </Suspense>
    );
  }

  // Priority 3: Dashboard (Logged in & Setup Complete)
  if (session) {
    return (
      <DashboardLayout currentView={currentView} setCurrentView={setCurrentView}>
        <Suspense fallback={<LoadingFallback />}>
          {currentView === 'dashboard' && <DashboardHome />}
          {currentView === 'assets' && <Wallets />}
          {currentView === 'analytics' && <Analytics />}
          {currentView === 'goals' && <Goals />}
          {currentView === 'ai-chat' && <AIChat />}
          {currentView === 'categories' && <Categories />}
          {currentView === 'debts' && <Debts />}
          {currentView === 'budgets' && <Budgets />}
          {currentView === 'settings' && <Settings />}
        </Suspense>
      </DashboardLayout>
    );
  }

  // Rest of auth flow...
  if (showAuth) {
    return (
      <Layout>
        <Auth />
      </Layout>
    );
  }

  return (
    <Layout>
      <Onboarding onComplete={() => setShowAuth(true)} />
    </Layout>
  );
};

import { domMax, LazyMotion } from "framer-motion"

function App() {
  return (
    <LazyMotion features={domMax}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LazyMotion>
  );
}

export default App;
