import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Archive, Trash2, Edit2, CornerDownRight, X, User } from 'lucide-react';
import { ChatMessage, ProductionOrder, Role } from '../types';

interface ChatDrawerProps {
  order: ProductionOrder;
  messages: ChatMessage[];
  role: Role;
  onSendMsg: (msg: ChatMessage) => void;
  onReplyMsg: (msgId: string, replyText: string) => void;
  onArchiveMsg: (msgId: string) => void;
  onDeleteMsg: (msgId: string) => void;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  order,
  messages,
  role,
  onSendMsg,
  onReplyMsg,
  onArchiveMsg,
  onDeleteMsg,
  onClose,
}) => {
  const [textInput, setTextInput] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendNewMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      orderId: order.id,
      orderNumero: order.numero,
      orderDesc: order.descricao,
      from: role,
      text: textInput.trim(),
      timestamp: new Date().toISOString(),
      readByPcp: role === 'pcp',
      readByProducao: role === 'producao',
      replies: [],
    };

    onSendMsg(newMsg);
    setTextInput('');
  };

  const handleSendReply = (msgId: string) => {
    const text = replyInputs[msgId]?.trim();
    if (!text) return;

    onReplyMsg(msgId, text);
    setReplyInputs((prev) => ({ ...prev, [msgId]: '' }));
    setActiveReplyId(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left">
      {/* Drawer Header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                {order.numero}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {order.status}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{order.descricao}</h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message History Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
            <p className="font-semibold">Nenhum aviso ou observação registrada para esta OP.</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-600">
              Digite abaixo para notificar o {role === 'pcp' ? 'Eduardo (Produção)' : 'PCP'}.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isPcp = m.from === 'pcp';

            return (
              <div key={m.id} className="space-y-2">
                {/* Parent Message */}
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                    isPcp
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-100'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3 h-3" />
                      <span>{isPcp ? '📋 PCP' : '🏭 Eduardo (Produção)'}</span>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(m.timestamp).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-900 dark:text-white leading-relaxed font-medium">{m.text}</p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-white/10 text-[10px]">
                    <button
                      onClick={() => setActiveReplyId(activeReplyId === m.id ? null : m.id)}
                      className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Responder</span>
                    </button>

                    <button
                      onClick={() => onArchiveMsg(m.id)}
                      className={`flex items-center gap-1 cursor-pointer font-bold transition-colors ${
                        m.arquivada
                          ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                          : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      <Archive className="w-3 h-3" />
                      <span>{m.arquivada ? '✓ Arquivado (Reabrir)' : 'Resolver / Arquivar'}</span>
                    </button>
                  </div>
                </div>

                {/* Reply Threads */}
                {m.replies && m.replies.length > 0 && (
                  <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-800">
                    {m.replies.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{r.from === 'pcp' ? '📋 PCP' : '🏭 Eduardo'}</span>
                          <span>
                            {new Date(r.timestamp).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Reply Input Box */}
                {activeReplyId === m.id && (
                  <div className="pl-4 flex gap-2">
                    <input
                      type="text"
                      value={replyInputs[m.id] || ''}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply(m.id)}
                      placeholder="Responder este aviso..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSendReply(m.id)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Send Form */}
      <form onSubmit={handleSendNewMessage} className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={`Aviso para ${role === 'pcp' ? 'Eduardo (Produção)' : 'PCP'} sobre ${order.numero}...`}
          className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-blue-600/30"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
};
