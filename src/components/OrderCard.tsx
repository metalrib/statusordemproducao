import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  Star,
  PauseCircle,
  PlayCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  FileText,
  Boxes,
  Send,
  Sparkles,
} from 'lucide-react';
import { OrderStatusKey, ProductionOrder, Role } from '../types';
import { COMMON_DELAY_REASONS, MANUAL_STATUS, STATUS_CONFIG } from '../constants';
import { daysInfo, formatQuantity, detectUnidade } from '../utils/nomusParser';

interface OrderCardProps {
  order: ProductionOrder;
  role: Role;
  unreadCount?: number;
  darkMode?: boolean;
  onStatusChange: (id: string, newStatus: OrderStatusKey, motivo?: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePaused: (id: string) => void;
  onOpenChat: (order: ProductionOrder) => void;
  onArchiveMsgs?: () => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  role,
  unreadCount = 0,
  darkMode = true,
  onStatusChange,
  onToggleFavorite,
  onTogglePaused,
  onOpenChat,
  onArchiveMsgs,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [motivoInput, setMotivoInput] = useState(order.motivo_atraso || '');
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [savedMotivoNotice, setSavedMotivoNotice] = useState(false);

  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.planejada;
  const deadline = daysInfo(order.data_entrega);

  const isOverdue = order.status === 'atrasada' || (deadline?.isOverdue ?? false);

  const handleSaveMotivo = () => {
    if (!motivoInput.trim()) return;
    onStatusChange(order.id, order.status, motivoInput.trim());
    setSavedMotivoNotice(true);
    setTimeout(() => {
      setSavedMotivoNotice(false);
      setShowMotivoModal(false);
    }, 1200);
  };

  const handleQuickStatusChange = (newStatus: OrderStatusKey) => {
    if (newStatus === 'atrasada') {
      setShowMotivoModal(true);
    } else {
      onStatusChange(order.id, newStatus);
    }
  };

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md ${
        order.pausada ? 'opacity-60 grayscale-[30%]' : ''
      }`}
      style={{
        backgroundColor: darkMode ? (statusInfo.bgColorDark || '#180d0e') : statusInfo.bgColorLight,
        borderColor: unreadCount > 0 ? '#EF4444' : (darkMode ? (statusInfo.borderColorDark || '#e03131') : statusInfo.borderColorLight),
      }}
    >
      {/* Card Header & Main Specs */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-4 cursor-pointer select-none space-y-3"
      >
        <div className="flex items-start justify-between gap-3">
          {/* OP Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg tracking-wider border"
                style={{
                  backgroundColor: `${statusInfo.color}15`,
                  color: statusInfo.color,
                  borderColor: `${statusInfo.color}35`,
                }}
              >
                {order.numero}
              </span>

              {unreadCount > 0 && (
                <span className="px-2.5 py-1 text-[10px] font-black bg-rose-600 text-white rounded-full uppercase tracking-wider animate-pulse shadow-sm">
                  {unreadCount} {unreadCount === 1 ? 'Novo Aviso' : 'Novos Avisos'}
                </span>
              )}

              {order.favorito && (
                <span className="text-amber-400 text-xs flex items-center gap-0.5 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </span>
              )}

              {order.pausada && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-md">
                  Pausada
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug tracking-tight uppercase">
              {order.descricao}
            </h3>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span className="font-mono text-[12px]">Cód: {order.codigo}</span>
              {order.lote && (
                <span className="text-slate-400">· Lote: {order.lote}</span>
              )}
            </div>
          </div>

          {/* Quantities Badge */}
          <div className="text-right flex-shrink-0 bg-slate-100 dark:bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col justify-center min-w-[75px]">
            <div
              className="text-2xl font-black font-mono leading-none"
              style={{ color: statusInfo.color }}
            >
              {formatQuantity(order.quantidade)}
            </div>
            <div className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {order.qtde_produzida > 0
                ? `${formatQuantity(order.qtde_produzida)}/${formatQuantity(order.quantidade)} ${order.unidade || 'pc'} prod.`
                : `${order.unidade || detectUnidade(order.descricao, order.quantidade)}`}
            </div>
          </div>
        </div>

        {/* Status Badge & Delay Motivo Alert */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border"
              style={{
                backgroundColor: `${statusInfo.color}20`,
                color: statusInfo.color,
                borderColor: `${statusInfo.color}40`,
              }}
            >
              <span>{statusInfo.icon}</span>
              <span>{statusInfo.label}</span>
            </span>

            {deadline && (
              <span
                className="px-2.5 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 border"
                style={{
                  backgroundColor: `${deadline.color}20`,
                  color: deadline.color,
                  borderColor: `${deadline.color}40`,
                }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{deadline.text}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
            <span className="text-xs font-semibold">
              {expanded ? 'Ocultar' : 'Detalhes'}
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Delay Reason Banner if delayed */}
        {order.motivo_atraso && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-rose-300 font-bold">Motivo do Atraso:</strong>{' '}
              {order.motivo_atraso}
            </div>
          </div>
        )}
      </div>

      {/* Expanded Controls & Status Options */}
      {expanded && (
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 space-y-4 animate-fade-in text-xs">
          {/* Quick Actions (Favorite / Pause) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(order.id)}
              className={`flex-1 py-1.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                order.favorito
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${order.favorito ? 'fill-amber-400' : ''}`} />
              <span>{order.favorito ? 'Favoritada' : 'Favoritar'}</span>
            </button>

            <button
              onClick={() => onTogglePaused(order.id)}
              className={`flex-1 py-1.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                order.pausada
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {order.pausada ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
              <span>{order.pausada ? 'Retomar OP' : 'Pausar OP'}</span>
            </button>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Status Nomus ERP</div>
              <div className="font-bold text-slate-200 mt-0.5">{order.status_nomus}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Prazo de Entrega</div>
              <div className="font-bold text-slate-200 mt-0.5">{order.data_entrega || '—'}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Lote / Ordem</div>
              <div className="font-bold text-slate-200 mt-0.5">{order.lote || '—'}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Observações</div>
              <div className="font-medium text-slate-300 mt-0.5 truncate">
                {order.observacao || '—'}
              </div>
            </div>
          </div>

          {/* Change Status Buttons (For Eduardo & PCP) */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mudar Status do Fluxo da Fábrica:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => handleQuickStatusChange('produzindo_hoje')}
                className={`p-2 rounded-xl border font-bold text-[11px] flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  order.status === 'produzindo_hoje'
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 ring-1 ring-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <span className="text-base">⚙️</span>
                <span>Produzindo Hoje</span>
              </button>

              <button
                onClick={() => handleQuickStatusChange('falta_embalar')}
                className={`p-2 rounded-xl border font-bold text-[11px] flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  order.status === 'falta_embalar'
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <span className="text-base">📦</span>
                <span>Falta Embalar</span>
              </button>

              <button
                onClick={() => handleQuickStatusChange('embalada')}
                className={`p-2 rounded-xl border font-bold text-[11px] flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  order.status === 'embalada'
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <span className="text-base">✅</span>
                <span>Embalada</span>
              </button>

              <button
                onClick={() => setShowMotivoModal(true)}
                className={`p-2 rounded-xl border font-bold text-[11px] flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  order.status === 'atrasada'
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400 ring-1 ring-rose-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-rose-500/50'
                }`}
              >
                <span className="text-base">⚠️</span>
                <span>Sinalizar Atraso</span>
              </button>
            </div>
          </div>

          {/* Chat & Notes Action Bar */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => onOpenChat(order)}
              className="flex-1 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Abrir Chat / Avisos da OP ({unreadCount > 0 ? `${unreadCount} novos` : '0'})</span>
            </button>
          </div>
        </div>
      )}

      {/* Delay Reason Input Modal */}
      {showMotivoModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-extrabold text-sm text-white">Registrar Motivo do Atraso</h4>
              </div>
              <button
                onClick={() => setShowMotivoModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Informe o motivo pelo qual a <strong>{order.numero}</strong> ({order.descricao}) está atrasada:
            </p>

            {/* Common Quick Reasons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase">
                Motivos Frequentes:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {COMMON_DELAY_REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setMotivoInput(r)}
                    className="text-[11px] text-slate-300 bg-slate-800 hover:bg-blue-900/40 hover:text-blue-200 border border-slate-700 rounded-lg px-2.5 py-1 text-left transition-all cursor-pointer"
                  >
                    + {r}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={motivoInput}
              onChange={(e) => setMotivoInput(e.target.value)}
              placeholder="Descreva o motivo detalhado do atraso..."
              rows={3}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs outline-none focus:ring-2 focus:ring-rose-500"
            />

            {savedMotivoNotice && (
              <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold text-center">
                ✓ Motivo registrado com sucesso!
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowMotivoModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onStatusChange(order.id, 'atrasada', motivoInput);
                  handleSaveMotivo();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer"
              >
                Salvar Atraso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
