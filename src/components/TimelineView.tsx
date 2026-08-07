import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { OrderStatusKey, ProductionOrder, Role } from '../types';
import { daysInfo } from '../utils/nomusParser';
import { OrderCard } from './OrderCard';

interface TimelineViewProps {
  orders: ProductionOrder[];
  role: Role;
  unreadMap: Record<string, number>;
  onStatusChange: (id: string, newStatus: OrderStatusKey, motivo?: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePaused: (id: string) => void;
  onOpenChat: (order: ProductionOrder) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  orders,
  role,
  unreadMap,
  onStatusChange,
  onToggleFavorite,
  onTogglePaused,
  onOpenChat,
}) => {
  // Group orders by timeline urgency
  const overdue: ProductionOrder[] = [];
  const today: ProductionOrder[] = [];
  const next3Days: ProductionOrder[] = [];
  const thisWeek: ProductionOrder[] = [];
  const future: ProductionOrder[] = [];

  orders.forEach((o) => {
    const info = daysInfo(o.data_entrega);
    if (o.status === 'atrasada' || (info && info.days < 0)) {
      overdue.push(o);
    } else if (o.status === 'hoje' || (info && info.days === 0)) {
      today.push(o);
    } else if (info && info.days > 0 && info.days <= 3) {
      next3Days.push(o);
    } else if (info && info.days > 3 && info.days <= 7) {
      thisWeek.push(o);
    } else {
      future.push(o);
    }
  });

  const timelineGroups = [
    { title: 'Atrasadas (Atenção Crítica)', orders: overdue, badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30', icon: '⚠️' },
    { title: 'Entrega Hoje', orders: today, badgeBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: '📅' },
    { title: 'Próximos 3 Dias', orders: next3Days, badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '⏳' },
    { title: 'Esta Semana', orders: thisWeek, badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: '🗓️' },
    { title: 'Futuro / Planejado', orders: future, badgeBg: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: '📋' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Intro Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>OPs Atrasadas</span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {overdue.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Entrega Hoje</span>
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono mt-1">
            {today.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>Próximos 3 Dias</span>
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {next3Days.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Esta Semana</span>
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono mt-1">
            {thisWeek.length}
          </div>
        </div>
      </div>

      {/* Timeline Groups */}
      <div className="space-y-6">
        {timelineGroups.map((group) => {
          if (group.orders.length === 0) return null;

          return (
            <div
              key={group.title}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{group.icon}</span>
                  <h3 className="font-extrabold text-base text-white">{group.title}</h3>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border ${group.badgeBg}`}
                >
                  {group.orders.length} OPs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    role={role}
                    unreadCount={unreadMap[order.numero] || 0}
                    onStatusChange={onStatusChange}
                    onToggleFavorite={onToggleFavorite}
                    onTogglePaused={onTogglePaused}
                    onOpenChat={onOpenChat}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
