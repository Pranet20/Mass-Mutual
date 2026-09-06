import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { EmployeePortal } from './pages/EmployeePortal';
import { Dashboard } from './pages/Dashboard';
import { Employees } from './pages/Employees';
import { Pipeline } from './pages/Pipeline';
import { Reports } from './pages/Reports';
import { Forecasting } from './pages/Forecasting';
import { PowerBI } from './pages/PowerBI';
import { Assistant } from './pages/Assistant';

const MainLayout = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // If user is not logged in, render the LoginModal over the screen
  if (!user) {
    return <LoginModal />;
  }

  // If user is logged in as Employee, render dedicated EmployeePortal
  if (user.role === 'employee') {
    return <EmployeePortal />;
  }

  // Manager Role Layout
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'employees':
        return <Employees />;
      case 'pipeline':
        return <Pipeline />;
      case 'reports':
        return <Reports />;
      case 'forecasting':
        return <Forecasting />;
      case 'powerbi':
        return <PowerBI />;
      case 'assistant':
        return <Assistant />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar activeTab={activeTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
