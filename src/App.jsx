import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import { useState } from 'react';

import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Settings from './pages/dashboard/Settings';
import Wallets from './pages/dashboard/Wallets';
import Analytics from './pages/dashboard/Analytics';

const AppContent = () => {
  const { session } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // Simple routing state

  // If logged in, show Dashboard with routing
  if (session) {
    return (
      <DashboardLayout currentView={currentView} setCurrentView={setCurrentView}>
        {currentView === 'dashboard' && <DashboardHome />}
        {currentView === 'assets' && <Wallets />}
        {currentView === 'analytics' && <Analytics />}
        {currentView === 'settings' && <Settings />}
      </DashboardLayout>
    );
  }

  // If showing auth (after onboarding or via skip)
  if (showAuth) {
    return (
      <Layout>
        <Auth />
      </Layout>
    );
  }

  // Default: Onboarding
  return (
    <Layout>
      <Onboarding onComplete={() => setShowAuth(true)} />
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
