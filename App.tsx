
import React, { useState, useRef, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import OriginDetail from './components/OriginDetail';
import ImportView from './components/ImportView';
import PdfManager from './components/PdfManager';
import { INITIAL_DATA, mapCityToZone } from './constants';
import { AppView, OriginZone, PdfDocument, AppNotification } from './types';
import { Bell, Search, X, Check, Box } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>(AppView.OVERVIEW);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [data, setData] = useState<OriginZone[]>(INITIAL_DATA);
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>([]);
  
  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Helper to get selected zone object
  const selectedZone = data.find(z => z.id === selectedZoneId);

  // Handler for navigation
  const handleNavigate = (view: AppView, zoneId?: string) => {
    setCurrentView(view);
    if (zoneId) {
      setSelectedZoneId(zoneId);
    } else {
      setSelectedZoneId(null);
    }
  };

  // Callback receives processed data from ImportView and updates App state
  const handleDataImport = (newZonesData: OriginZone[]) => {
    // Generate notifications for EACH route imported
    const newNotifications: AppNotification[] = [];
    
    newZonesData.forEach(zone => {
      zone.routes.forEach(route => {
        // Create individual notification per load/circuit
        newNotifications.push({
          id: Math.random().toString(36).substr(2, 9),
          message: `1 carga inclusa na zona de origem ${zone.name} no circuito ${route.id}`,
          timestamp: new Date(),
          read: false,
          type: 'SUCCESS'
        });
      });
    });

    // Add new notifications to the top of the list
    // Limit to last 100 to prevent memory issues if file is huge
    setNotifications(prev => [...newNotifications, ...prev].slice(0, 200));
    
    // Update Data
    setData(newZonesData);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // --- PDF HANDLERS ---
  const handlePdfUpload = (files: FileList) => {
    // Mock extraction logic since OCR requires backend or complex lib
    // In a real scenario, this would parse the PDF text
    const newDocs: PdfDocument[] = Array.from(files).map(file => {
      // Create a mock extraction based on filename or random data for demonstration
      // If filename contains specific patterns, try to map them
      
      const mockCities = ['Uberlândia', 'Chapecó', 'Londrina', 'Videira', 'Toledo'];
      const mockStates = ['MG', 'SC', 'PR', 'SC', 'PR'];
      const randIdx = Math.floor(Math.random() * mockCities.length);
      
      const city = mockCities[randIdx];
      const state = mockStates[randIdx];
      const zoneCode = mapCityToZone(city, state);
      
      const id = Math.random().toString(36).substr(2, 9);
      
      return {
        id,
        fileName: file.name,
        extractionId: `EXT-${Math.floor(Math.random() * 10000)}`,
        extractedOriginCity: city,
        extractedOriginState: state,
        extractedDestination: 'São Paulo', // Mock destination
        mappedZoneId: zoneCode,
        isDuplicate: Math.random() > 0.9, // Mock 10% chance of duplicate
        selected: false
      };
    });

    setPdfDocuments(prev => [...prev, ...newDocs]);
  };

  const handlePdfDelete = (ids: string[]) => {
    setPdfDocuments(prev => prev.filter(d => !ids.includes(d.id)));
  };

  const handlePdfToggleSelect = (id: string) => {
    setPdfDocuments(prev => prev.map(d => d.id === id ? { ...d, selected: !d.selected } : d));
  };

  const handlePdfSelectAll = (select: boolean) => {
    setPdfDocuments(prev => prev.map(d => ({ ...d, selected: select })));
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans text-piano-text">
      <Sidebar 
        zones={data}
        currentView={currentView}
        selectedZoneId={selectedZoneId}
        onNavigate={handleNavigate}
        onLogout={() => setIsLoggedIn(false)}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-piano-900 relative">
        {/* Background gradient hint */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Header */}
        <header className="h-20 bg-black/50 border-b border-piano-800 flex items-center justify-between px-8 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center text-piano-muted bg-piano-800/50 rounded px-4 py-3 border border-piano-700 w-96 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-900 transition-all">
            <Search size={20} className="mr-3" />
            <input 
                type="text" 
                placeholder="Buscar contrato..." 
                className="bg-transparent border-none focus:outline-none text-base text-white w-full placeholder-piano-600"
            />
          </div>

          <div className="flex items-center space-x-6">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-3 transition-colors relative ${showNotifications ? 'text-cyan-400' : 'text-piano-muted hover:text-cyan-400'}`}
              >
                <Bell size={28} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-3 h-3 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-piano-900 border border-piano-700 rounded-lg shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex justify-between items-center px-4 py-3 border-b border-piano-800 bg-black/50">
                    <h3 className="text-sm font-bold text-white">Notificações</h3>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllRead} 
                            className="text-[10px] text-cyan-500 hover:text-cyan-400 flex items-center gap-1"
                          >
                            <Check size={10} /> Ler tudo
                          </button>
                        )}
                        {notifications.length > 0 && (
                           <button 
                            onClick={clearNotifications} 
                            className="text-[10px] text-red-500 hover:text-red-400 flex items-center gap-1"
                          >
                            <X size={10} /> Limpar
                          </button>
                        )}
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-piano-600">
                        <Bell size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Nenhuma notificação nova</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-piano-800">
                        {notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            className={`p-4 flex gap-3 hover:bg-piano-800/50 transition-colors ${!notif.read ? 'bg-cyan-900/5' : ''}`}
                          >
                            <div className="mt-1">
                                <div className="bg-cyan-900/30 p-1.5 rounded-full text-cyan-400 border border-cyan-900">
                                   <Box size={12} />
                                </div>
                            </div>
                            <div className="flex-1">
                              <p className={`text-xs ${!notif.read ? 'text-white font-medium' : 'text-piano-muted'}`}>
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-piano-700 mt-1">
                                {notif.timestamp.toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                            {!notif.read && (
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-10 w-10 rounded bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center text-sm font-bold text-cyan-400">
              MB
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 relative z-0">
          <div className="w-full h-full flex flex-col">
            {currentView === AppView.OVERVIEW && (
              <Overview zones={data} />
            )}

            {currentView === AppView.ZONE_DETAIL && selectedZone && (
              <OriginDetail zone={selectedZone} />
            )}

            {currentView === AppView.IMPORT && (
              <ImportView 
                currentZones={data} 
                onProcessData={handleDataImport} 
              />
            )}

            {currentView === AppView.PDF_UPLOAD && (
              <PdfManager 
                documents={pdfDocuments}
                onUpload={handlePdfUpload}
                onDelete={handlePdfDelete}
                onToggleSelect={handlePdfToggleSelect}
                onSelectAll={handlePdfSelectAll}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
