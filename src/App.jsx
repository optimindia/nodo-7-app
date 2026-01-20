import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Auth from './pages/Auth';
import BlockedAccount from './pages/BlockedAccount'; // Import Blocked Screen
import { useState } from 'react';

import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import Settings from './pages/dashboard/Settings';
import Wallets from './pages/dashboard/Wallets';
import Analytics from './pages/dashboard/Analytics';
import Goals from './pages/dashboard/Goals';
import AIChat from './pages/dashboard/AIChat';
import Categories from './pages/dashboard/Categories';
import Debts from './pages/dashboard/Debts';
import UserSetupWizard from './pages/UserSetupWizard';

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
    return <UserSetupWizard onComplete={() => window.location.reload()} />;
  }

  // Priority 3: Dashboard (Logged in & Setup Complete)
  if (session) {
    return (
      <DashboardLayout currentView={currentView} setCurrentView={setCurrentView}>
        {currentView === 'dashboard' && <DashboardHome />}
        {currentView === 'assets' && <Wallets />}
        {currentView === 'analytics' && <Analytics />}
        {currentView === 'goals' && <Goals />}
        {currentView === 'ai-chat' && <AIChat />}
        {currentView === 'categories' && <Categories />}
        {currentView === 'debts' && <Debts />}
        {currentView === 'settings' && <Settings />}
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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
