import React from 'react';
import { BarChart3, AlertTriangle, Layers, PieChart, TrendingDown, CheckCircle2, Factory } from 'lucide-react';
import { ProductionOrder } from '../types';
import { CATEGORIES, STATUS_CONFIG } from '../constants';

interface AnalyticsViewProps {
  orders: ProductionOrder[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders }) => {
  const total = orders.length;
  const delayedOrders = orders.filter((o) => o.status === 'atrasada');
  const delayedCount = delayedOrders.length;
  const todayCount = orders.filter((o) => o.status === 'hoje').length;
  const inProdCount = orders.filter((o) => o.status === 'produzindo_hoje').length;
  const readyCount = orders.filter((o) => o.status === 'embalada').length;

  const onTimePercentage = total > 0 ? Math.round(((total - delayedCount) / total) * 100) : 100;

  // Breakdown of top delay reasons
  const delayReasonsMap: Record<string, number> = {};
  delayedOrders.forEach((o) => {
    const r = o.motivo_atraso?.trim() || 'Não especificado pelo PCP/Produção';
    delayReasonsMap[r] = (delayReasonsMap[r] || 0) + 1;
  });

  const sortedReasons = Object.entries(delayReasonsMap).sort((a, b) => b[1] - a[1]);

  // Breakdown by Category
  const categoryMap: Record<string, { total: number; delayed: number; inProd: number }> = {};
  CATEGORIES.forEach((c) => {
    if (c.key !== 'todas') {
      categoryMap[c.key] = { total: 0, delayed: 0, inProd: 0 };
    }
  });

  orders.forEach((o) => {
    const cat = o.categoria || 'outros';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, delayed: 0, inProd: 0 };
    categoryMap[cat].total += 1;
    if (o.status === 'atrasada') categoryMap[cat].delayed += 1;
    if (o.status === 'produzindo_hoje') categoryMap[cat].inProd += 1;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400">Total de Ordens na Fábrica</div>
            <div className="text-3xl font-black text-white font-mono mt-1">{total}</div>
            <div className="text-[11px] text-slate-500 mt-1">{readyCount} já embaladas</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold">
            <Factory className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-400">Ordens Atrasadas</div>
            <div className="text-3xl font-black text-rose-400 font-mono mt-1">{delayedCount}</div>
            <div className="text-[11px] text-rose-300/70 mt-1">Requer atenção do PCP</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-cyan-400">Produzindo Hoje</div>
            <div className="text-3xl font-black text-cyan-400 font-mono mt-1">{inProdCount}</div>
            <div className="text-[11px] text-cyan-300/70 mt-1">Em execução no chão de fábrica</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl font-bold">
            ⚙️
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400">Índice de Cumprimento</div>
            <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{onTimePercentage}%</div>
            <div className="text-[11px] text-emerald-300/70 mt-1">Pontualidade geral</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reasons for Delay Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Principais Motivos de Atraso</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">{sortedReasons.length} causas</span>
          </div>

          {sortedReasons.length === 0 ? (
            <div className="py-12 text-center text-emerald-400 text-xs font-bold">
              ✓ Nenhuma ordem atrasada registrada no momento!
            </div>
          ) : (
            <div className="space-y-3">
              {sortedReasons.map(([reason, count]) => {
                const percentage = Math.round((count / delayedCount) * 100);
                return (
                  <div key={reason} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-200">
                      <span className="truncate pr-2">{reason}</span>
                      <span className="font-mono text-rose-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-600 to-amber-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Distribution Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-blue-400 font-extrabold text-base">
              <Layers className="w-5 h-5" />
              <span>Distribuição por Categoria de Produto</span>
            </div>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {CATEGORIES.filter((c) => c.key !== 'todas').map((cat) => {
              const data = categoryMap[cat.key] || { total: 0, delayed: 0, inProd: 0 };
              if (data.total === 0) return null;

              return (
                <div
                  key={cat.key}
                  className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <div className="font-bold text-xs text-white">{cat.label}</div>
                      <div className="text-[11px] text-slate-400">
                        {data.total} ordens ({data.inProd} em produção)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {data.delayed > 0 ? (
                      <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold font-mono">
                        {data.delayed} atrasadas
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold font-mono">
                        Em dia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
