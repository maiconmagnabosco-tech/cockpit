import React, { useState, useMemo } from 'react';
import { OriginZone } from '../types';
import { COMPLIANCE_THRESHOLD, COMPLIANCE_THRESHOLD_GIF, ROUTE_MIN_THRESHOLD, getDateFactor } from '../constants';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingUp, DollarSign, Package, AlertCircle, Target, CheckCircle, ShieldAlert, Calendar, TrendingDown, ThumbsUp } from 'lucide-react';

interface OverviewProps {
  zones: OriginZone[];
}

type ViewMode = 'BONUS' | 'GIF';

const Overview: React.FC<OverviewProps> = ({ zones }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('BONUS');

  // Obtém dados dinâmicos de data
  const { currentDay, totalDays, factor: dateFactor, formattedDate } = getDateFactor();
  const monthProgressPct = (dateFactor * 100).toFixed(1);

  // Determine which threshold to use based on mode
  const currentThreshold = viewMode === 'BONUS' ? COMPLIANCE_THRESHOLD : COMPLIANCE_THRESHOLD_GIF;

  // Perform calculations
  const { tableData, totals, systemHealth, routeHealth } = useMemo(() => {
    let criticalZones = 0;
    let warningZones = 0;
    let healthyZones = 0;
    
    // Contadores Globais de Rotas
    let globalRoutesAbove = 0;
    let globalRoutesBelow = 0;

    const data = zones.map(zone => {
      const contracted = zone.routes.reduce((acc, r) => acc + r.contractedVolume, 0);
      const realized = zone.routes.reduce((acc, r) => acc + r.realizedVolume, 0);
      
      // Route Analysis for Zone Health
      let zoneFailingRoutes = 0;
      
      zone.routes.forEach(r => {
        const isForaCircuito = r.destination.includes('FORA DO CIRCUITO');
        const pct = r.contractedVolume > 0 ? r.realizedVolume / r.contractedVolume : 0;
        
        if (pct < ROUTE_MIN_THRESHOLD) {
            // Só conta como falha se NÃO for uma rota "Fora do Circuito"
            // Rotas fora do circuito não possuem obrigação de meta mínima de 40%
            if (!isForaCircuito) {
                zoneFailingRoutes++;
                globalRoutesBelow++;
            }
        } else {
            globalRoutesAbove++;
        }
      });

      if (zoneFailingRoutes > 2) criticalZones++;
      else if (zoneFailingRoutes > 0) warningZones++;
      else healthyZones++;

      // Meta Final do Mês (Baseada no Threshold selecionado 90% ou 95%)
      const minTargetEndOfMonth = Math.floor(contracted * currentThreshold);
      
      // Meta Proporcional HOJE
      const proportionalMin = Math.ceil(minTargetEndOfMonth * dateFactor);
      
      const gap = realized - proportionalMin;
      const adherence = proportionalMin > 0 ? (realized / proportionalMin) * 100 : 0;

      return {
        ...zone,
        contracted,
        realized,
        minTarget: minTargetEndOfMonth, // Meta Final
        proportionalMin, // Meta Hoje
        gap,
        adherence
      };
    });

    // ORDENAÇÃO: Do maior volume contratado para o menor
    data.sort((a, b) => b.contracted - a.contracted);

    const totalStats = data.reduce((acc, curr) => ({
      contracted: acc.contracted + curr.contracted,
      minTarget: acc.minTarget + curr.minTarget,
      proportionalMin: acc.proportionalMin + curr.proportionalMin,
      realized: acc.realized + curr.realized,
      gap: acc.gap + curr.gap,
      revenue: acc.revenue + curr.financialRevenue,
      bonus: acc.bonus + curr.financialBonus
    }), { contracted: 0, minTarget: 0, proportionalMin: 0, realized: 0, gap: 0, revenue: 0, bonus: 0 });

    return { 
        tableData: data, 
        totals: totalStats,
        systemHealth: { criticalZones, warningZones, healthyZones },
        routeHealth: { above: globalRoutesAbove, below: globalRoutesBelow }
    };
  }, [zones, currentThreshold, viewMode, dateFactor]);

  // Aderência Global
  const totalAdherence = totals.proportionalMin > 0 ? (totals.realized / totals.proportionalMin) * 100 : 0;

  // Chart Data
  const chartData = tableData.map(d => ({
    name: d.name,
    realized: d.realized,
    target: d.proportionalMin, // Gráfico compara com a meta de HOJE
    gap: d.gap
  }));

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white tracking-tight">Visão Geral de Metas</h2>
          <div className="flex items-center gap-4 mt-2">
             <div className="flex items-center gap-2 text-sm font-bold bg-piano-800 text-cyan-400 px-3 py-1 rounded border border-cyan-900/50">
                <Calendar size={14} />
                {formattedDate} (Dia {currentDay}/{totalDays})
             </div>
             <p className="text-piano-muted text-base border-l-2 border-cyan-500 pl-4">
               {viewMode === 'BONUS' ? 'Meta Bonificação (90% do Total)' : 'Meta GIF (95% do Total)'}
             </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-piano-800 p-1.5 rounded-lg border border-piano-700 flex">
          <button
            onClick={() => setViewMode('BONUS')}
            className={`flex items-center px-6 py-3 rounded text-sm font-bold uppercase tracking-wide transition-all duration-200
              ${viewMode === 'BONUS' 
                ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                : 'text-piano-muted hover:text-white hover:bg-piano-700'}`}
          >
            <DollarSign size={18} className="mr-2" />
            Bonificação (90%)
          </button>
          <button
            onClick={() => setViewMode('GIF')}
            className={`flex items-center px-6 py-3 rounded text-sm font-bold uppercase tracking-wide transition-all duration-200
              ${viewMode === 'GIF' 
                ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                : 'text-piano-muted hover:text-white hover:bg-piano-700'}`}
          >
            <Target size={18} className="mr-2" />
            GIF (95%)
          </button>
        </div>
      </header>
      
      {/* Date Progress Bar */}
      <div className="w-full bg-piano-800 h-2 rounded-full overflow-hidden flex">
          <div className="h-full bg-cyan-600 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${monthProgressPct}%` }}></div>
      </div>
      <div className="flex justify-between text-xs text-piano-muted uppercase font-bold mt-[-32px] mb-6">
          <span>Início Mês</span>
          <span>Progresso Temporal: {monthProgressPct}%</span>
          <span>Fim Mês</span>
      </div>

      {/* SYSTEM HEALTH ALERT BANNER */}
      {routeHealth.below > 0 ? (
        <div className="bg-yellow-950/30 border border-yellow-900/50 rounded-xl p-6 flex items-center gap-8 shadow-lg">
             <div className="bg-yellow-900/50 p-4 rounded-full text-yellow-500">
                <AlertCircle size={40} />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-yellow-500">Atenção aos Circuitos</h3>
                <p className="text-yellow-200/70 text-lg mt-1">
                    Existem <strong>{routeHealth.below} rotas operando abaixo de 40%</strong> no total da rede.
                    Acompanhe o indicador global de performance.
                </p>
            </div>
        </div>
      ) : (
         <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-xl p-6 flex items-center gap-8 shadow-lg">
             <div className="bg-cyan-900/50 p-4 rounded-full text-cyan-400">
                <CheckCircle size={40} />
            </div>
            <div>
                <h3 className="text-2xl font-bold text-cyan-400">Rede Operando com Excelência</h3>
                <p className="text-cyan-200/70 text-lg mt-1">
                    Todas as rotas estão acima do gatilho mínimo de 40%.
                </p>
            </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Meta Hoje */}
        <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-cyan-500/30 transition-colors shadow-lg">
          <div className="flex items-center gap-6">
            <div className="bg-piano-900 p-4 rounded-lg text-cyan-500 border border-piano-700">
              <Package size={32} />
            </div>
            <div>
              <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Meta Hoje ({monthProgressPct}%)</p>
              <h3 className="text-5xl font-bold text-white mt-1">{totals.proportionalMin}</h3>
              <p className="text-xs text-piano-600 mt-1">Baseado no Min. {viewMode === 'BONUS' ? '90%' : '95%'}</p>
            </div>
          </div>
        </div>
        
        {/* Card 2: Realizado Geral */}
        <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-cyan-500/30 transition-colors shadow-lg">
           <div className="flex items-center gap-6">
            <div className="bg-piano-900 p-4 rounded-lg text-cyan-500 border border-piano-700">
              <TrendingUp size={32} />
            </div>
            <div>
              <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Realizado Geral</p>
              <h3 className="text-5xl font-bold text-white mt-1">{totals.realized}</h3>
            </div>
          </div>
        </div>

        {/* Card 3: Saldo */}
        <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-cyan-500/30 transition-colors shadow-lg">
           <div className="flex items-center gap-6">
            <div className={`p-4 rounded-lg border border-piano-700 bg-piano-900 ${totals.gap < 0 ? 'text-red-500' : 'text-cyan-500'}`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Saldo Hoje</p>
              <h3 className={`text-5xl font-bold mt-1 ${totals.gap < 0 ? 'text-red-400' : 'text-cyan-400'}`}>
                {totals.gap > 0 ? `+${totals.gap}` : totals.gap}
              </h3>
            </div>
          </div>
        </div>
        
        {/* Card 4: Rotas Saudáveis (>40%) - NEW */}
        <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-green-500/30 transition-colors shadow-lg">
            <div className="flex items-center gap-6">
                <div className="bg-piano-900 p-4 rounded-lg text-green-500 border border-piano-700">
                    <ThumbsUp size={32} />
                </div>
                <div>
                    <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Rotas Saudáveis ({'>'}40%)</p>
                    <h3 className="text-5xl font-bold text-green-400 mt-1">{routeHealth.above}</h3>
                </div>
            </div>
        </div>

        {/* Card 5: Rotas Críticas (<40%) - NEW */}
        <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-red-500/30 transition-colors shadow-lg">
            <div className="flex items-center gap-6">
                <div className="bg-piano-900 p-4 rounded-lg text-red-500 border border-piano-700">
                    <TrendingDown size={32} />
                </div>
                <div>
                    <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Rotas Críticas ({'<'}40%)</p>
                    <h3 className={`text-5xl font-bold mt-1 ${routeHealth.below > 0 ? 'text-red-500' : 'text-piano-muted'}`}>
                        {routeHealth.below}
                    </h3>
                </div>
            </div>
        </div>

        {/* Card 6: Financeiro/Bonus */}
        {viewMode === 'BONUS' ? (
          <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-cyan-500/30 transition-colors shadow-lg">
             <div className="flex items-center gap-6">
              <div className="bg-piano-900 p-4 rounded-lg text-cyan-500 border border-piano-700">
                <DollarSign size={32} />
              </div>
              <div>
                <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Bonificação Est.</p>
                <h3 className="text-4xl font-bold text-white mt-2">{formatCurrency(totals.bonus)}</h3>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-piano-800 p-6 rounded-xl border border-piano-700 hover:border-cyan-500/30 transition-colors shadow-lg">
             <div className="flex items-center gap-6">
              <div className="bg-piano-900 p-4 rounded-lg text-cyan-500 border border-piano-700">
                <Target size={32} />
              </div>
              <div>
                <p className="text-sm text-piano-muted uppercase tracking-wider font-bold">Pacing GIF</p>
                <h3 className={`text-5xl font-bold mt-1 ${totalAdherence >= 100 ? 'text-cyan-400' : 'text-piano-muted'}`}>
                  {totalAdherence.toFixed(1)}%
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-piano-700 bg-piano-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse">
            <thead>
              {/* Colored Headers Row - Black Piano Style with Accents */}
              <tr className="text-white font-bold text-xs uppercase tracking-wider bg-black">
                <th className="p-5 border-r border-piano-700 border-b-2 border-b-cyan-500">Origem</th>
                <th className="p-5 border-r border-piano-700 border-b-2 border-b-piano-600">Programador</th>
                <th className={`p-5 border-r border-piano-700 border-b-2 ${viewMode === 'BONUS' ? 'border-b-red-600' : 'border-b-purple-600'}`} colSpan={2}>
                  Metas Finais
                </th>
                <th className="p-5 border-r border-piano-700 border-b-2 border-b-orange-600" colSpan={2}>
                  Status Hoje (Dia {currentDay})
                </th>
                <th className="p-5 border-r border-piano-700 border-b-2 border-b-yellow-600" colSpan={2}>Performance</th>
                <th className="p-5 border-b-2 border-b-cyan-500" colSpan={2}>Financeiro</th>
              </tr>
              {/* Sub-Headers Row */}
              <tr className="bg-piano-900 text-piano-muted text-xs font-semibold uppercase">
                <th className="p-4 border-r border-piano-800 text-left pl-8">Zona Origem</th>
                <th className="p-4 border-r border-piano-800">Responsável</th>
                <th className="p-4 border-r border-piano-800 bg-white/5 text-white">Contrato Total</th>
                <th className="p-4 border-r border-piano-800 bg-white/5">Meta Final ({viewMode === 'BONUS' ? '90%' : '95%'})</th>
                <th className="p-4 border-r border-piano-800 text-cyan-400">Meta P/ Hoje</th>
                <th className="p-4 border-r border-piano-800 text-white">Realizado</th>
                <th className="p-4 border-r border-piano-800">Gap Hoje</th>
                <th className="p-4 border-r border-piano-800">Aderência</th>
                <th className="p-4 border-r border-piano-800 text-cyan-600">Faturamento</th>
                <th className="p-4 text-cyan-600">Bonificação</th>
              </tr>
            </thead>
            
            {/* Total Row */}
            <tbody className="bg-black text-white font-bold text-sm border-b border-piano-700">
                <tr>
                    <td className="p-5 text-left pl-8 text-cyan-400 text-lg">TOTAL GERAL</td>
                    <td className="p-5">-</td>
                    <td className="p-5 text-lg">{totals.contracted}</td>
                    <td className="p-5 text-piano-muted text-lg">{totals.minTarget}</td>
                    <td className="p-5 text-cyan-400 text-lg">{totals.proportionalMin}</td>
                    <td className="p-5 text-white text-xl">{totals.realized}</td>
                    <td className="p-5 bg-piano-900 border-x border-piano-800 text-red-400 text-lg">{totals.gap}</td>
                    <td className="p-5 text-lg">{totalAdherence.toFixed(2)}%</td>
                    <td className="p-5 font-mono text-piano-muted">{formatCurrency(totals.revenue)}</td>
                    <td className="p-5 font-mono text-cyan-400">{formatCurrency(totals.bonus)}</td>
                </tr>
            </tbody>

            {/* Data Rows */}
            <tbody className="divide-y divide-piano-800 bg-piano-900/40 text-base">
              {tableData.map((row) => (
                <tr key={row.id} className="hover:bg-piano-800 transition-colors text-piano-text group">
                  <td className="p-4 font-medium text-left pl-8 border-r border-piano-800 group-hover:text-white">{row.name}</td>
                  <td className="p-4 font-medium text-piano-muted border-r border-piano-800 text-sm">{row.programmer}</td>
                  
                  <td className="p-4 font-mono border-r border-piano-800 bg-black/20 text-lg">{row.contracted}</td>
                  <td className="p-4 font-mono text-piano-muted border-r border-piano-800 bg-black/20 text-lg">{row.minTarget}</td>
                  
                  <td className="p-4 font-mono italic text-cyan-600 border-r border-piano-800 text-lg">{row.proportionalMin}</td>
                  <td className="p-4 font-bold border-r border-piano-800 text-white text-lg">{row.realized}</td>
                  
                  {/* Gap */}
                  <td className={`p-4 font-bold border-r border-piano-800 text-lg ${row.gap < 0 ? 'text-red-500 bg-red-950/10' : 'text-cyan-500 bg-cyan-950/10'}`}>
                    {row.gap > 0 ? `+${row.gap}` : row.gap}
                  </td>
                  
                  <td className="p-4 font-bold border-r border-piano-800 text-lg">
                    <span className={`${row.adherence < 100 ? 'text-red-400' : 'text-cyan-400'}`}>
                        {row.adherence.toFixed(1)}%
                    </span>
                  </td>
                  
                  <td className="p-4 font-mono text-sm border-r border-piano-800 text-piano-muted">{formatCurrency(row.financialRevenue)}</td>
                  <td className="p-4 font-mono text-sm text-piano-muted group-hover:text-cyan-400 transition-colors">{formatCurrency(row.financialBonus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-piano-800 p-8 rounded-xl border border-piano-700 shadow-lg relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="text-2xl font-bold text-white tracking-tight">Análise Pacing de Cargas (Realizado vs Meta Hoje)</h3>
            <span className={`text-xs font-bold px-4 py-2 rounded border ${viewMode === 'BONUS' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-900' : 'bg-purple-950/30 text-purple-400 border-purple-900'}`}>
                {viewMode === 'BONUS' ? 'MODO: BONIFICAÇÃO (90%)' : 'MODO: VISÃO GIF (95%)'}
            </span>
        </div>
        {/* Increased Height significantly for better visibility */}
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} barGap={4} margin={{ top: 30, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="name" stroke="#525252" tick={{fill: '#737373', fontSize: 14}} interval={0} height={70} angle={-15} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis stroke="#525252" tick={{fill: '#737373', fontSize: 14}} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#262626', color: '#E5E5E5', fontSize: '14px', padding: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                cursor={{ fill: '#262626', opacity: 0.4 }}
              />
              <Bar dataKey="target" name="Meta Hoje" fill="#404040" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="target" position="top" fill="#A3A3A3" fontSize={12} formatter={(val: number) => val > 0 ? val : ''} />
              </Bar>
              <Bar dataKey="realized" name="Realizado" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="realized" position="top" fill="#FFFFFF" fontSize={14} fontWeight="bold" />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.gap < 0 ? '#EF4444' : '#22D3EE'} strokeWidth={0} />
                ))}
              </Bar>
              {/* Linha de Tendência baseada no Realizado */}
              <Line 
                type="monotone" 
                dataKey="realized" 
                stroke="#F59E0B" 
                strokeWidth={3} 
                dot={{r: 5, fill: '#F59E0B'}} 
                activeDot={{r: 8}} 
                name="Tendência Real."
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Overview;