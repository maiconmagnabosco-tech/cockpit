import React, { useMemo } from 'react';
import { OriginZone, RouteContract } from '../types';
import { COMPLIANCE_THRESHOLD, ROUTE_MIN_THRESHOLD } from '../constants';
import { AlertTriangle, TrendingDown, CheckCircle, FileSpreadsheet, Activity, Shuffle, Info, ShieldAlert } from 'lucide-react';

interface OriginDetailProps {
  zone: OriginZone;
}

const OriginDetail: React.FC<OriginDetailProps> = ({ zone }) => {
  // Logic: Count routes below 40% (ROUTE_MIN_THRESHOLD)
  const analysis = useMemo(() => {
    const routesAnalysis = zone.routes.map(route => {
      const percentage = route.contractedVolume > 0 
        ? route.realizedVolume / route.contractedVolume 
        : 0;
      // Using ROUTE_MIN_THRESHOLD (40%) instead of general compliance for individual route alerts
      
      // Check if it's a "FORA DO CIRCUITO" route
      const isForaCircuito = route.destination.includes('FORA DO CIRCUITO');

      // Uma rota só é considerada abaixo do limite se NÃO for "Fora do Circuito"
      // Rotas fora do circuito são incrementais e não penalizam a zona
      const isBelowThreshold = percentage < ROUTE_MIN_THRESHOLD && !isForaCircuito;

      return { ...route, percentage, isBelowThreshold, isForaCircuito };
    });

    // ORDENAÇÃO: Do maior volume contratado para o menor
    routesAnalysis.sort((a, b) => b.contractedVolume - a.contractedVolume);

    const failingRoutesCount = routesAnalysis.filter(r => r.isBelowThreshold).length;
    const totalRoutes = zone.routes.length;
    
    const healthyRoutesCount = totalRoutes - failingRoutesCount;
    const healthPercentage = totalRoutes > 0 ? (healthyRoutesCount / totalRoutes) * 100 : 0;

    let status: 'CRITICAL' | 'WARNING' | 'GOOD' = 'GOOD';
    
    // Simplificado: Se há rotas falhando, é um alerta, mas o limite crítico é global
    if (failingRoutesCount > 0) {
        status = 'WARNING';
    }

    return {
      routes: routesAnalysis,
      failingRoutesCount,
      totalRoutes,
      healthPercentage,
      status
    };
  }, [zone]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header className="flex justify-between items-center mb-4 border-b border-piano-800 pb-6">
        <div>
          <h2 className="text-4xl font-bold text-white flex items-center gap-4">
            {zone.name}
            {analysis.status === 'WARNING' && (
              <span className="px-4 py-2 text-sm font-bold bg-yellow-900/30 text-yellow-500 border border-yellow-900 rounded-full flex items-center gap-2">
                <Activity size={16} /> ATENÇÃO
              </span>
            )}
             {analysis.status === 'GOOD' && (
              <span className="px-4 py-2 text-sm font-bold bg-cyan-900/30 text-cyan-400 border border-cyan-900 rounded-full flex items-center gap-2">
                <CheckCircle size={16} /> ALTA PERFORMANCE
              </span>
            )}
          </h2>
          <p className="text-piano-muted text-base mt-2">Detalhamento operacional de rotas</p>
        </div>
      </header>

      {/* ALERT BANNER SYSTEM */}
      {analysis.status === 'WARNING' && (
        <div className="bg-yellow-950/20 border-l-8 border-yellow-500 p-6 rounded-r shadow-[0_0_20px_rgba(234,179,8,0.1)] flex items-start gap-6 animate-in fade-in slide-in-from-top-2">
            <div className="bg-yellow-900/30 p-3 rounded text-yellow-500 shrink-0">
                <Info size={32} />
            </div>
            <div>
                <h4 className="font-bold text-yellow-400 text-xl">Atenção Necessária</h4>
                <p className="text-yellow-200/80 text-base mt-2">
                    Esta zona possui <strong>{analysis.failingRoutesCount} rota(s) operando abaixo de 40%</strong>. 
                    Verifique se estas rotas impactam o limite global permitido para a rede.
                </p>
            </div>
        </div>
      )}

      {analysis.status === 'GOOD' && (
        <div className="bg-cyan-950/20 border-l-8 border-cyan-500 p-6 rounded-r shadow-[0_0_20px_rgba(34,211,238,0.1)] flex items-start gap-6 animate-in fade-in slide-in-from-top-2">
            <div className="bg-cyan-900/30 p-3 rounded text-cyan-400 shrink-0">
                <CheckCircle size={32} />
            </div>
            <div>
                <h4 className="font-bold text-cyan-400 text-xl">Operação Saudável</h4>
                <p className="text-cyan-200/80 text-base mt-2">
                    Excelente trabalho! <strong>Todas as rotas</strong> estão operando acima do gatilho mínimo de 40%.
                    Mantenha o ritmo de alocação de cargas para maximizar a bonificação.
                </p>
            </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card 1: Total Routes */}
        <div className="bg-piano-800 p-8 rounded-xl border border-piano-700 shadow-lg relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="relative z-10">
            <p className="text-xs font-bold text-piano-muted uppercase tracking-widest">Total de Rotas</p>
            <h3 className="text-7xl font-bold text-white mt-4 group-hover:text-cyan-400 transition-colors">{analysis.totalRoutes}</h3>
            <p className="text-sm text-piano-600 mt-2">Nesta zona de origem</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-cyan-900/10 to-transparent"></div>
        </div>

        {/* Card 2: Routes Below Threshold - REMOVIDO TEXTO DE LIMITE */}
        <div className={`p-8 rounded-xl border shadow-lg relative overflow-hidden transition-colors duration-300
          ${analysis.failingRoutesCount > 0 ? 'bg-yellow-950/10 border-yellow-900/50' : 'bg-piano-800 border-piano-700'}`}>
          <div className="relative z-10">
            <p className={`text-xs font-bold uppercase tracking-widest ${analysis.failingRoutesCount > 0 ? 'text-white' : 'text-piano-muted'}`}>
              Rotas em Alerta ({'<'}40%)
            </p>
            <h3 className={`text-7xl font-bold mt-4 ${analysis.failingRoutesCount > 0 ? 'text-yellow-500' : 'text-white'}`}>
              {analysis.failingRoutesCount}
            </h3>
            {/* Texto de limite removido conforme solicitado */}
            <p className={`text-sm mt-2 ${analysis.failingRoutesCount > 0 ? 'text-white/50' : 'text-piano-600'}`}>
              Rotas operando abaixo do gatilho
            </p>
          </div>
        </div>
        
        {/* Card 3: Info/Health */}
        <div className="bg-piano-800 p-8 rounded-xl border border-piano-700 shadow-lg flex flex-col justify-center relative overflow-hidden">
          <div className="flex items-start gap-4 relative z-10">
             <div className="bg-piano-900 p-3 rounded text-cyan-500 shrink-0 border border-piano-700">
               <Activity size={24} />
             </div>
             <div>
               <h4 className="text-base font-bold text-white uppercase tracking-wide">Saúde da Zona</h4>
               <div className="text-5xl font-bold text-cyan-400 mt-2">
                 {analysis.healthPercentage.toFixed(1)}%
               </div>
               <p className="text-xs text-piano-muted mt-2 leading-relaxed">
                 Rotas operando acima do gatilho mínimo.
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* Detailed Routes Table */}
      <div className="bg-piano-800 rounded-xl border border-piano-700 shadow-xl overflow-hidden mt-10">
        <div className="px-8 py-5 border-b border-piano-700 bg-black/20 flex justify-between items-center">
          <h3 className="font-bold text-white text-base uppercase tracking-wide">Performance por Rota</h3>
          <div className="text-xs font-bold text-piano-muted flex items-center gap-4 uppercase">
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span> Crítico</span>
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.8)]"></span> Normal</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-base text-left">
            <thead className="text-xs text-piano-muted uppercase bg-piano-900 border-b border-piano-700">
              <tr>
                <th className="px-8 py-5 font-semibold tracking-wider">Rota / Destino</th>
                <th className="px-8 py-5 text-right font-semibold tracking-wider">Contratado</th>
                <th className="px-8 py-5 text-right font-semibold tracking-wider">Realizado</th>
                <th className="px-8 py-5 text-center font-semibold tracking-wider">Atingimento</th>
                <th className="px-8 py-5 text-center font-semibold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-piano-800">
              {analysis.routes.map((route) => (
                <tr key={route.id} className={`transition-colors border-l-4 
                  ${route.isBelowThreshold ? 'border-l-red-500 bg-red-950/5 hover:bg-red-950/10' : 'border-l-transparent hover:bg-piano-700/30'}`}>
                  
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                        <div className="font-medium text-white text-lg">
                            {route.isForaCircuito ? (
                                <span className="flex items-center gap-2 text-purple-400">
                                    <Shuffle size={16} className="text-purple-500" />
                                    {route.destination}
                                </span>
                            ) : (
                                <span>{route.origin} <span className="text-piano-700 mx-2">➔</span> {route.destination}</span>
                            )}
                        </div>
                    </div>
                    {!route.isForaCircuito && <div className="text-xs text-piano-600 mt-1 ml-0 font-mono">ID: {route.id}</div>}
                  </td>
                  
                  <td className="px-8 py-5 text-right text-piano-muted font-mono bg-black/10 text-lg">
                    {route.contractedVolume}
                  </td>
                  
                  <td className="px-8 py-5 text-right text-white font-bold font-mono bg-black/10 text-lg">
                    {route.realizedVolume}
                  </td>
                  
                  <td className="px-8 py-5 align-middle">
                    <div className="w-full max-w-[160px] mx-auto">
                      <div className="flex justify-between text-xs mb-1.5 font-bold">
                        <span className={route.isBelowThreshold ? 'text-red-500' : 'text-cyan-400'}>
                          {(route.percentage * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-piano-900 rounded-full h-2 border border-piano-700">
                        <div 
                          className={`h-2 rounded-full transition-all duration-1000 relative ${route.isBelowThreshold ? 'bg-red-600' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(route.percentage * 100, 100)}%` }}
                        >
                            {/* Glow effect */}
                            <div className={`absolute right-0 top-0 bottom-0 w-2 blur-[2px] ${route.isBelowThreshold ? 'bg-red-400' : 'bg-cyan-300'}`}></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-8 py-5 text-center">
                    {route.isBelowThreshold ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded text-xs font-bold bg-red-950 text-red-500 border border-red-900 uppercase tracking-wide">
                        <TrendingDown size={14} className="mr-1.5" /> Crítico
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded text-xs font-bold bg-cyan-950 text-cyan-400 border border-cyan-900 uppercase tracking-wide">
                        <CheckCircle size={14} className="mr-1.5" /> OK
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OriginDetail;