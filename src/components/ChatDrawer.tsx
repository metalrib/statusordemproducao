import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Archive,
  Trash2,
  Edit2,
  CornerDownRight,
  X,
  User,
  Check,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, ProductionOrder, Role } from '../types';

interface ChatDrawerProps {
  order: ProductionOrder;
  messages: ChatMessage[];
  role: Role;
  onSendMsg: (msg: ChatMessage) => void;
  onReplyMsg: (msgId: string, replyText: string) => void;
  onEditMsg: (msgId: string, newText: string) => void;
  onDeleteMsg: (msgId: string) => void;
  onEditReply: (msgId: string, replyId: string, newText: string) => void;
  onDeleteReply: (msgId: string, replyId: string) => void;
  onArchiveMsg: (msgId: string) => void;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  order,
  messages,
  role,
  onSendMsg,
  onReplyMsg,
  onEditMsg,
  onDeleteMsg,
  onEditReply,
  onDeleteReply,
  onArchiveMsg,
  onClose,
}) => {
  const [textInput, setTextInput] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // Editing parent message
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editMsgText, setEditMsgText] = useState('');

  // Editing reply
  const [editingReplyId, setEditingReplyId] = useState<{ msgId: string; replyId: string } | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  // Confirm delete states
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<string | null>(null);
  const [confirmDeleteReplyId, setConfirmDeleteReplyId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeReplyId && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [activeReplyId]);

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

  const startEditMessage = (msg: ChatMessage) => {
    setEditingMsgId(msg.id);
    setEditMsgText(msg.text);
    setEditingReplyId(null);
  };

  const saveEditMessage = (msgId: string) => {
    if (editMsgText.trim()) {
      onEditMsg(msgId, editMsgText.trim());
    }
    setEditingMsgId(null);
    setEditMsgText('');
  };

  const startEditReply = (msgId: string, replyId: string, currentText: string) => {
    setEditingReplyId({ msgId, replyId });
    setEditReplyText(currentText);
    setEditingMsgId(null);
  };

  const saveEditReply = (msgId: string, replyId: string) => {
    if (editReplyText.trim()) {
      onEditReply(msgId, replyId, editReplyText.trim());
    }
    setEditingReplyId(null);
    setEditReplyText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-slide-left"
      >
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
              const isEditingThisMsg = editingMsgId === m.id;
              const isConfirmingDelete = confirmDeleteMsgId === m.id;

              return (
                <div key={m.id} className="space-y-2">
                  {/* Parent Message Card */}
                  <div
                    className={`p-3.5 rounded-2xl border text-xs space-y-2 transition-all ${
                      isPcp
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-100'
                        : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-100'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        <span>{isPcp ? '📋 PCP' : '🏭 Eduardo (Produção)'}</span>
                        {m.editado && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal italic">
                            (editado)
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Content or Edit Field */}
                    {isEditingThisMsg ? (
                      <div className="space-y-2 pt-1">
                        <textarea
                          value={editMsgText}
                          onChange={(e) => setEditMsgText(e.target.value)}
                          rows={3}
                          className="w-full p-2.5 bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-500 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Editar mensagem..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                              saveEditMessage(m.id);
                            } else if (e.key === 'Escape') {
                              setEditingMsgId(null);
                            }
                          }}
                        />
                        <div className="flex items-center justify-end gap-2 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setEditingMsgId(null)}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditMessage(m.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Salvar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-900 dark:text-white leading-relaxed font-medium whitespace-pre-wrap">
                        {m.text}
                      </p>
                    )}

                    {/* Delete Confirmation Box */}
                    {isConfirmingDelete && (
                      <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 flex items-center justify-between text-[11px] text-red-800 dark:text-red-200">
                        <span className="font-semibold">Confirmar exclusão?</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setConfirmDeleteMsgId(null)}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] cursor-pointer"
                          >
                            Não
                          </button>
                          <button
                            onClick={() => {
                              onDeleteMsg(m.id);
                              setConfirmDeleteMsgId(null);
                            }}
                            className="px-2.5 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] cursor-pointer hover:bg-red-700"
                          >
                            Sim, Apagar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-white/10 text-[10px]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveReplyId(activeReplyId === m.id ? null : m.id);
                            setEditingMsgId(null);
                          }}
                          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-bold transition-colors"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          <span>Responder</span>
                        </button>

                        <button
                          onClick={() => startEditMessage(m)}
                          className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                          title="Editar mensagem"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => setConfirmDeleteMsgId(isConfirmingDelete ? null : m.id)}
                          className="text-slate-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer font-semibold transition-colors"
                          title="Apagar mensagem"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Apagar</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onArchiveMsg(m.id)}
                        className={`flex items-center gap-1 cursor-pointer font-bold transition-colors ${
                          m.arquivada
                            ? 'text-amber-600 dark:text-amber-400 hover:text-amber-700'
                            : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300'
                        }`}
                      >
                        <Archive className="w-3 h-3" />
                        <span>{m.arquivada ? '✓ Reabrir' : 'Resolver / Arquivar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Reply Threads */}
                  {m.replies && m.replies.length > 0 && (
                    <div className="pl-3.5 space-y-2 border-l-2 border-slate-300 dark:border-slate-800">
                      {m.replies.map((r) => {
                        const isEditingThisReply =
                          editingReplyId?.msgId === m.id && editingReplyId?.replyId === r.id;
                        const isConfirmingDeleteReply = confirmDeleteReplyId === r.id;

                        return (
                          <div
                            key={r.id}
                            className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <span>{r.from === 'pcp' ? '📋 PCP' : '🏭 Eduardo'}</span>
                                {r.editado && (
                                  <span className="text-[9px] font-normal italic text-slate-400 dark:text-slate-500">
                                    (editado)
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px]">
                                  {new Date(r.timestamp).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                <button
                                  onClick={() => startEditReply(m.id, r.id, r.text)}
                                  className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded cursor-pointer transition-colors"
                                  title="Editar resposta"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setConfirmDeleteReplyId(isConfirmingDeleteReply ? null : r.id)
                                  }
                                  className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded cursor-pointer transition-colors"
                                  title="Apagar resposta"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>

                            {/* Reply Delete Confirmation */}
                            {isConfirmingDeleteReply && (
                              <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 flex items-center justify-between text-[10px] text-red-800 dark:text-red-200">
                                <span>Apagar resposta?</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setConfirmDeleteReplyId(null)}
                                    className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                                  >
                                    Não
                                  </button>
                                  <button
                                    onClick={() => {
                                      onDeleteReply(m.id, r.id);
                                      setConfirmDeleteReplyId(null);
                                    }}
                                    className="px-2 py-0.5 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                                  >
                                    Apagar
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Reply Text or Inline Edit */}
                            {isEditingThisReply ? (
                              <div className="space-y-1.5 pt-1">
                                <input
                                  type="text"
                                  value={editReplyText}
                                  onChange={(e) => setEditReplyText(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-500 rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditReply(m.id, r.id);
                                    if (e.key === 'Escape') setEditingReplyId(null);
                                  }}
                                />
                                <div className="flex justify-end gap-1.5 text-[9px]">
                                  <button
                                    onClick={() => setEditingReplyId(null)}
                                    className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => saveEditReply(m.id, r.id)}
                                    className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                {r.text}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Reply Input Box */}
                  {activeReplyId === m.id && (
                    <div className="pl-3.5 flex gap-2 animate-fade-in">
                      <input
                        ref={replyInputRef}
                        type="text"
                        value={replyInputs[m.id] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(m.id)}
                        placeholder={`Responder aviso do ${isPcp ? 'PCP' : 'Eduardo'}...`}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-blue-400 dark:border-blue-500/60 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleSendReply(m.id)}
                        className="px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>Enviar</span>
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
    </div>
  );
};

