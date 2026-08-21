import React from 'react';
import { ChatMessage, OrderStatusKey, ProductionOrder, Role } from '../types';
import { STATUS_CONFIG, S_ORDER } from '../constants';
import { OrderCard } from './OrderCard';

interface KanbanBoardProps {
  orders: ProductionOrder[];
  role: Role;
  unreadMap: Record<string, number>;
  messages?: ChatMessage[];
  darkMode?: boolean;
  onStatusChange: (id: string, newStatus: OrderStatusKey, motivo?: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePaused: (id: string) => void;
  onOpenChat: (order: ProductionOrder) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  orders,
  role,
  unreadMap,
  messages = [],
  darkMode = true,
  onStatusChange,
  onToggleFavorite,
  onTogglePaused,
  onOpenChat,
}) => {
  // Select key Kanban columns for optimal screen real estate
  const kanbanColumns: OrderStatusKey[] = [
    'atrasada',
    'hoje',
    'produzindo_hoje',
    'falta_embalar',
    'embalada',
    'planejada',
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 items-start snap-x">
      {kanbanColumns.map((colKey) => {
        const info = STATUS_CONFIG[colKey];
        const colOrders = orders.filter((o) => o.status === colKey);

        return (
          <div
            key={colKey}
            className="w-80 flex-shrink-0 snap-none flex flex-col rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[calc(100vh-12rem)] shadow-sm"
          >
            {/* Column Header */}
            <div
              className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
              style={{ backgroundColor: `${info.color}15` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{info.icon}</span>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  {info.label}
                </span>
              </div>
              <span
                className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${info.color}30`, color: info.color }}
              >
                {colOrders.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              {colOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                  Nenhuma OP nesta coluna
                </div>
              ) : (
                colOrders.map((order) => {
                  const orderMsgs = messages.filter(
                    (m) =>
                      m.orderId === order.id ||
                      m.orderNumero === order.numero ||
                      (m.orderNumero || '').replace(/\s+/g, '').toLowerCase() ===
                        (order.numero || '').replace(/\s+/g, '').toLowerCase()
                  );

                  return (
                    <OrderCard
                      key={order.id}
                      order={order}
                      role={role}
                      darkMode={darkMode}
                      unreadCount={unreadMap[order.numero] || 0}
                      orderMessages={orderMsgs}
                      onStatusChange={onStatusChange}
                      onToggleFavorite={onToggleFavorite}
                      onTogglePaused={onTogglePaused}
                      onOpenChat={onOpenChat}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
