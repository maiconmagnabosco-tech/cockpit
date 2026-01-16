import React from 'react';
import { LayoutDashboard, Map as MapIcon, LogOut, UploadCloud, FileText } from 'lucide-react';
import { OriginZone, AppView } from '../types';

interface SidebarProps {
  zones: OriginZone[];
  currentView: AppView;
  selectedZoneId: string | null;
  onNavigate: (view: AppView, zoneId?: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ zones, currentView, selectedZoneId, onNavigate, onLogout }) => {
  return (
    <div className="w-72 h-screen bg-black border-r border-piano-800 flex flex-col text-piano-muted">
      <div className="p-8 border-b border-piano-800 bg-piano-900/30">
        <h1 className="text-2xl font-bold text-white tracking-wider">MAGNABOSCO</h1>
        <p className="text-xs text-cyan-500 uppercase tracking-[0.2em] mt-2">Logistics Intelligence</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-8 space-y-2">
        <div className="px-8 mb-4 text-xs font-bold text-piano-700 uppercase tracking-widest text-left">
          Painel Principal
        </div>
        
        <button
          onClick={() => onNavigate(AppView.OVERVIEW)}
          className={`w-full flex items-center justify-start px-8 py-4 text-base font-medium transition-all duration-200 border-l-4 text-left
            ${currentView === AppView.OVERVIEW 
              ? 'bg-piano-800 text-cyan-400 border-cyan-400 shadow-[inset_10px_0_20px_-10px_rgba(34,211,238,0.1)]' 
              : 'border-transparent hover:bg-piano-800/50 hover:text-white hover:border-piano-700'}`}
        >
          <LayoutDashboard size={22} className={`mr-4 shrink-0 ${currentView === AppView.OVERVIEW ? 'text-cyan-400' : 'text-piano-600'}`} />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => onNavigate(AppView.IMPORT)}
          className={`w-full flex items-center justify-start px-8 py-4 text-base font-medium transition-all duration-200 border-l-4 text-left
            ${currentView === AppView.IMPORT 
              ? 'bg-piano-800 text-cyan-400 border-cyan-400 shadow-[inset_10px_0_20px_-10px_rgba(34,211,238,0.1)]' 
              : 'border-transparent hover:bg-piano-800/50 hover:text-white hover:border-piano-700'}`}
        >
          <UploadCloud size={22} className={`mr-4 shrink-0 ${currentView === AppView.IMPORT ? 'text-cyan-400' : 'text-piano-600'}`} />
          <span>Importação de Contratos</span>
        </button>

        <button
          onClick={() => onNavigate(AppView.PDF_UPLOAD)}
          className={`w-full flex items-center justify-start px-8 py-4 text-base font-medium transition-all duration-200 border-l-4 text-left
            ${currentView === AppView.PDF_UPLOAD 
              ? 'bg-piano-800 text-cyan-400 border-cyan-400 shadow-[inset_10px_0_20px_-10px_rgba(34,211,238,0.1)]' 
              : 'border-transparent hover:bg-piano-800/50 hover:text-white hover:border-piano-700'}`}
        >
          <FileText size={22} className={`mr-4 shrink-0 ${currentView === AppView.PDF_UPLOAD ? 'text-cyan-400' : 'text-piano-600'}`} />
          <span>Gestão de Comprovantes</span>
        </button>

        <div className="px-8 mt-10 mb-4 text-xs font-bold text-piano-700 uppercase tracking-widest text-left">
          Zonas de Origem
        </div>

        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => onNavigate(AppView.ZONE_DETAIL, zone.id)}
            className={`w-full flex items-center justify-start px-8 py-4 text-base font-medium transition-all duration-200 border-l-4 text-left
              ${currentView === AppView.ZONE_DETAIL && selectedZoneId === zone.id
                ? 'bg-piano-800 text-cyan-400 border-cyan-400 shadow-[inset_10px_0_20px_-10px_rgba(34,211,238,0.1)]' 
                : 'border-transparent hover:bg-piano-800/50 hover:text-white hover:border-piano-700'}`}
          >
            <MapIcon size={22} className={`mr-4 shrink-0 ${currentView === AppView.ZONE_DETAIL && selectedZoneId === zone.id ? 'text-cyan-400' : 'text-piano-600'}`} />
            <span className="truncate">{zone.name}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-piano-800 bg-piano-900/30">
        <button 
          onClick={onLogout}
          className="flex items-center justify-start w-full px-4 py-3 text-base text-piano-muted hover:text-red-400 hover:bg-red-950/20 rounded transition-colors text-left"
        >
          <LogOut size={22} className="mr-4 shrink-0" />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;