import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { EmployeePortal } from './pages/EmployeePortal';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Pipeline } from './pages/Pipeline';
import { Forecasting } from './pages/Forecasting';
import { PowerBI } from './pages/PowerBI';
import ErrorBoundary from './components/ErrorBoundary';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import AccountDeletionModal from './components/AccountDeletionModal';
import analytics from './utils/analytics';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    analytics.init();
    analytics.trackPageView(activeTab);
  }, [activeTab]);

  // If user is not logged in, render the LoginModal over the screen
  if (!user) {
    return (
      <>
        <LoginModal onOpenPrivacyPolicy={() => setShowPrivacyModal(true)} />
        <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      </>
    );
  }

  // If user is logged in as Employee, render dedicated EmployeePortal
  if (user.role === 'employee') {
    return (
      <>
        <EmployeePortal
          onOpenPrivacyPolicy={() => setShowPrivacyModal(true)}
          onOpenAccountDeletion={() => setShowDeleteModal(true)}
        />
        <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
        <AccountDeletionModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={logout}
        />
      </>
    );
  }

  // Manager Role Layout
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigateToPowerBI={() => setActiveTab('powerbi')} />;
      case 'employees':
        return <Employees />;
      case 'pipeline':
        return <Pipeline />;
      case 'reports':
        return <PowerBI />;
      case 'forecasting':
        return <Forecasting />;
      case 'powerbi':
        return <PowerBI />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPrivacyPolicy={() => setShowPrivacyModal(true)}
        onOpenAccountDeletion={() => setShowDeleteModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          activeTab={activeTab}
          onOpenPrivacyPolicy={() => setShowPrivacyModal(true)}
          onOpenAccountDeletion={() => setShowDeleteModal(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      <PrivacyPolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <AccountDeletionModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={logout}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
