import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SafetySettings from './components/SafetySettings';
import CalendarPage from './components/CalendarPage';
import SyncCenter from './components/SyncCenter';

function App() {
  const [currentView, setCurrentView] = useState('Dashboard');

  return (
    <div className="flex h-screen w-screen bg-[#0a0e14] text-[#e6edf3] overflow-hidden">
      <Sidebar activeTab={currentView} onTabChange={setCurrentView} />
      <main className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'Dashboard' && <Dashboard onOpenSyncCenter={() => setCurrentView('Sync')} />}
        {currentView === 'Sync' && <SyncCenter />}
        {currentView === 'Safety' && <SafetySettings />}
        {currentView === 'Calendar' && <CalendarPage onOpenSyncCenter={() => setCurrentView('Sync')} />}
      </main>
    </div>
  );
}

export default App;
