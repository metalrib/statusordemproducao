import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Upload,
  Layers,
  Star,
  PauseCircle,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { ChatMessage, OrderStatusKey, ProductionOrder, Role, CategoryKey } from './types';
import { CATEGORIES, MANUAL_STATUS, S_ORDER, STATUS_CONFIG } from './constants';
import { storage } from './utils/storage';
import { SAMPLE_ORDERS } from './data/sampleOrders';
import {
  subscribeToOrders,
  subscribeToMessages,
  saveOrderToFirestore,
  saveOrdersBatchToFirestore,
  saveMessageToFirestore,
  deleteMessageFromFirestore,
  seedInitialFirestoreData,
} from './services/firestoreService';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { NomusImportModal } from './components/NomusImportModal';
import { OrderCard } from './components/OrderCard';
import { KanbanBoard } from './components/KanbanBoard';
import { TimelineView } from './components/TimelineView';
import { AnalyticsView } from './components/AnalyticsView';
import { ChatDrawer } from './components/ChatDrawer';
import { ExportPrintModal } from './components/ExportPrintModal';
import { BackupModal } from './components/BackupModal';

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Nav & Filter States
  const [activeTab, setActiveTab] = useState<'grid' | 'kanban' | 'timeline' | 'analytics' | 'messages'>('grid');
  const [ordersSubTab, setOrdersSubTab] = useState<'todas' | 'favoritas' | 'pausadas'>('todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<OrderStatusKey | 'todos'>('todos');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryKey>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [activeChatOrder, setActiveChatOrder] = useState<ProductionOrder | null>(null);

  // Initialize Data & Firestore Listeners
  useEffect(() => {
    const isDark = storage.getDarkMode();
    const fileName = storage.getUploadedFileName();
    setDarkMode(isDark);
    setUploadedFileName(fileName);

    // Initial fallback from storage
    const initialOrders = storage.getOrders();
    const initialMessages = storage.getMessages();
    setOrders(initialOrders);
    setMessages(initialMessages);

    // Seed Firestore if empty
    seedInitialFirestoreData(
      initialOrders.length > 0 ? initialOrders : SAMPLE_ORDERS,
      initialMessages
    );

    // Subscribe to real-time Firestore updates
    const unsubscribeOrders = subscribeToOrders((remoteOrders) => {
      if (remoteOrders && remoteOrders.length > 0) {
        setOrders(remoteOrders);
        storage.saveOrders(remoteOrders);
      }
    });

    const unsubscribeMessages = subscribeToMessages((remoteMessages) => {
      setMessages(remoteMessages);
      storage.saveMessages(remoteMessages);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMessages();
    };
  }, []);

  // Update HTML class for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.saveDarkMode(darkMode);
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRefreshDataFromStorage = () => {
    setOrders(storage.getOrders());
    setMessages(storage.getMessages());
    setUploadedFileName(storage.getUploadedFileName());
  };

  // Import Nomus ERP HTML Handler
  const handleImportOrders = (importedOrders: ProductionOrder[], fileName?: string) => {
    const prevOrders = orders;

    // Merge strategy: Keep existing manual statuses, delay reasons, favorites, and pauses
    const mergedList = importedOrders.map((imported) => {
      const existing = prevOrders.find((p) => p.numero === imported.numero || p.id === imported.id);
      if (existing) {
        return {
          ...imported,
          id: existing.id,
          motivo_atraso: existing.motivo_atraso || imported.motivo_atraso || '',
          status: MANUAL_STATUS.includes(existing.status) ? existing.status : imported.status,
          favorito: existing.favorito || false,
          pausada: existing.pausada || false,
        };
      }
      return imported;
    });

    setOrders(mergedList);
    storage.saveOrders(mergedList);
    saveOrdersBatchToFirestore(mergedList);

    if (fileName) {
      setUploadedFileName(fileName);
      storage.saveUploadedFileName(fileName);
    }
  };

  // Status Change Handler
  const handleStatusChange = (id: string, newStatus: OrderStatusKey, motivo?: string) => {
    let targetOrder: ProductionOrder | null = null;
    const updated = orders.map((o) => {
      if (o.id === id) {
        targetOrder = {
          ...o,
          status: newStatus,
          motivo_atraso: motivo !== undefined ? motivo : o.motivo_atraso || '',
          data_atualizacao: new Date().toISOString(),
        };
        return targetOrder;
      }
      return o;
    });

    setOrders(updated);
    storage.saveOrders(updated);
    if (targetOrder) {
      saveOrderToFirestore(targetOrder);
    }
  };

  // Toggle Favorite Handler
  const handleToggleFavorite = (id: string) => {
    let targetOrder: ProductionOrder | null = null;
    const updated = orders.map((o) => {
      if (o.id === id) {
        targetOrder = { ...o, favorito: !o.favorito };
        return targetOrder;
      }
      return o;
    });
    setOrders(updated);
    storage.saveOrders(updated);
    if (targetOrder) {
      saveOrderToFirestore(targetOrder);
    }
  };

  // Toggle Paused Handler
  const handleTogglePaused = (id: string) => {
    let targetOrder: ProductionOrder | null = null;
    const updated = orders.map((o) => {
      if (o.id === id) {
        targetOrder = { ...o, pausada: !o.pausada };
        return targetOrder;
      }
      return o;
    });
    setOrders(updated);
    storage.saveOrders(updated);
    if (targetOrder) {
      saveOrderToFirestore(targetOrder);
    }
  };

  // Messages / Chat Handlers
  const handleSendNewMessage = (newMsg: ChatMessage) => {
    const updated = [...messages, newMsg];
    setMessages(updated);
    storage.saveMessages(updated);
    saveMessageToFirestore(newMsg);
  };

  const handleReplyMessage = (msgId: string, replyText: string) => {
    let targetMsg: ChatMessage | null = null;
    const updated = messages.map((m) => {
      if (m.id === msgId) {
        const newReply = {
          id: Date.now().toString(36),
          from: role || 'pcp',
          text: replyText,
          timestamp: new Date().toISOString(),
          readByPcp: role === 'pcp',
          readByProducao: role === 'producao',
        };
        targetMsg = {
          ...m,
          readByPcp: role === 'pcp',
          readByProducao: role === 'producao',
          replies: [...(m.replies || []), newReply],
        };
        return targetMsg;
      }
      return m;
    });

    setMessages(updated);
    storage.saveMessages(updated);
    if (targetMsg) {
      saveMessageToFirestore(targetMsg);
    }
  };

  const handleArchiveMessage = (msgId: string) => {
    let targetMsg: ChatMessage | null = null;
    const updated = messages.map((m) => {
      if (m.id === msgId) {
        targetMsg = { ...m, arquivada: true, readByPcp: true, readByProducao: true };
        return targetMsg;
      }
      return m;
    });
    setMessages(updated);
    storage.saveMessages(updated);
    if (targetMsg) {
      saveMessageToFirestore(targetMsg);
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    const updated = messages.filter((m) => m.id !== msgId);
    setMessages(updated);
    storage.saveMessages(updated);
    deleteMessageFromFirestore(msgId);
  };

  // Unread Messages Calculation
  const unreadMap: Record<string, number> = {};
  messages.forEach((m) => {
    if (m.arquivada) return;
    const isUnread = role === 'pcp' ? !m.readByPcp : !m.readByProducao;
    if (isUnread) {
      unreadMap[m.orderNumero] = (unreadMap[m.orderNumero] || 0) + 1;
    }
  });

  const totalUnreadCount = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  // Mark as Read when opening chat
  const handleOpenChat = (order: ProductionOrder) => {
    setActiveChatOrder(order);

    // Mark messages as read for current role
    const updated = messages.map((m) => {
      if (m.orderNumero === order.numero || m.orderId === order.id) {
        const updatedMsg = {
          ...m,
          readByPcp: role === 'pcp' ? true : m.readByPcp,
          readByProducao: role === 'producao' ? true : m.readByProducao,
        };
        saveMessageToFirestore(updatedMsg);
        return updatedMsg;
      }
      return m;
    });

    setMessages(updated);
    storage.saveMessages(updated);
  };

  // Filtering Logic
  const baseOrders =
    ordersSubTab === 'favoritas'
      ? orders.filter((o) => o.favorito && !o.pausada)
      : ordersSubTab === 'pausadas'
      ? orders.filter((o) => o.pausada)
      : orders.filter((o) => !o.pausada);

  const filteredOrders = baseOrders.filter((o) => {
    const matchesStatus = selectedStatusFilter === 'todos' || o.status === selectedStatusFilter;
    const matchesCategory = selectedCategoryFilter === 'todas' || o.categoria === selectedCategoryFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      o.numero.toLowerCase().includes(query) ||
      o.descricao.toLowerCase().includes(query) ||
      o.codigo.toLowerCase().includes(query) ||
      o.lote.toLowerCase().includes(query) ||
      (o.motivo_atraso && o.motivo_atraso.toLowerCase().includes(query));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // Count summaries
  const delayedCount = orders.filter((o) => o.status === 'atrasada').length;
  const todayCount = orders.filter((o) => o.status === 'hoje').length;
  const inProdCount = orders.filter((o) => o.status === 'produzindo_hoje').length;
  const favoritesCount = orders.filter((o) => o.favorito && !o.pausada).length;
  const pausedCount = orders.filter((o) => o.pausada).length;

  if (!role) {
    return <LoginModal onLogin={setRole} darkMode={darkMode} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-12">
      {/* Sticky Header Navbar */}
      <Navbar
        role={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadCount={totalUnreadCount}
        totalOrdersCount={orders.length}
        delayedCount={delayedCount}
        todayCount={todayCount}
        inProductionCount={inProdCount}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onLogout={() => setRole(null)}
      />

      {/* Main App Workspace */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-6 space-y-6">
        {/* Nomus Import Dropzone Quick Trigger Banner */}
        {role === 'pcp' && (
          <div
            onClick={() => setIsImportModalOpen(true)}
            className="p-3.5 bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-900/60 border border-blue-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-lg group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">Importar HTML do Nomus ERP</span>
                  {uploadedFileName && (
                    <span className="px-2 py-0.5 text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full font-mono">
                      📄 {uploadedFileName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {uploadedFileName
                    ? 'Clique para atualizar o arquivo .html e atualizar o status das ordens'
                    : 'Clique ou arraste o arquivo .html exportado do Nomus para alimentar o sistema'}
                </p>
              </div>
            </div>

            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer hidden sm:flex items-center gap-1.5">
              <span>Importar Arquivo</span>
            </button>
          </div>
        )}

        {/* Tab 1: Orders Grid & List */}
        {activeTab === 'grid' && (
          <div className="space-y-5 animate-fade-in">
            {/* Subtabs (Todas / Favoritas / Pausadas) */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setOrdersSubTab('todas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  ordersSubTab === 'todas'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>Todas as OPs</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">
                  {orders.filter((o) => !o.pausada).length}
                </span>
              </button>

              <button
                onClick={() => setOrdersSubTab('favoritas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  ordersSubTab === 'favoritas'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Favoritas</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-black/20 rounded-full">
                  {favoritesCount}
                </span>
              </button>

              <button
                onClick={() => setOrdersSubTab('pausadas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  ordersSubTab === 'pausadas'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pausadas</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full">
                  {pausedCount}
                </span>
              </button>
            </div>

            {/* Status Quick Counters Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {S_ORDER.slice(0, 6).map((statusKey) => {
                const info = STATUS_CONFIG[statusKey];
                const count = orders.filter((o) => o.status === statusKey).length;
                const isSelected = selectedStatusFilter === statusKey;

                return (
                  <div
                    key={statusKey}
                    onClick={() =>
                      setSelectedStatusFilter(isSelected ? 'todos' : statusKey)
                    }
                    className={`p-3 rounded-2xl border cursor-pointer transition-all text-center select-none ${
                      isSelected
                        ? 'ring-2 ring-blue-500 scale-[1.02]'
                        : 'hover:border-slate-700'
                    }`}
                    style={{
                      backgroundColor: info.bgColorDark,
                      borderColor: isSelected ? info.color : info.borderColorDark,
                    }}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {info.label}
                    </div>
                    <div
                      className="text-2xl font-black font-mono mt-1 leading-none"
                      style={{ color: info.color }}
                    >
                      {count}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">
                      {isSelected ? '✓ Filtrado' : 'Filtrar'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search Bar & Category Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por número de OP, descrição, código do item, lote ou motivo de atraso..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {CATEGORIES.map((cat) => {
                  const catCount =
                    cat.key === 'todas'
                      ? orders.length
                      : orders.filter((o) => o.categoria === cat.key).length;

                  if (catCount === 0 && cat.key !== 'todas') return null;

                  const isCatSelected = selectedCategoryFilter === cat.key;

                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategoryFilter(cat.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        isCatSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                          isCatSelected ? 'bg-white/20' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {catCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Cards Grid */}
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl space-y-3">
                <Search className="w-10 h-10 mx-auto text-slate-600" />
                <h3 className="text-sm font-bold text-slate-300">Nenhuma Ordem de Produção Encontrada</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tente alterar os filtros de busca, selecionar outra categoria ou importar um novo arquivo HTML do Nomus ERP.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatusFilter('todos');
                    setSelectedCategoryFilter('todas');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Limpar Filtros de Busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    role={role}
                    unreadCount={unreadMap[order.numero] || 0}
                    onStatusChange={handleStatusChange}
                    onToggleFavorite={handleToggleFavorite}
                    onTogglePaused={handleTogglePaused}
                    onOpenChat={handleOpenChat}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Kanban View */}
        {activeTab === 'kanban' && (
          <KanbanBoard
            orders={orders}
            role={role}
            unreadMap={unreadMap}
            onStatusChange={handleStatusChange}
            onToggleFavorite={handleToggleFavorite}
            onTogglePaused={handleTogglePaused}
            onOpenChat={handleOpenChat}
          />
        )}

        {/* Tab 3: Timeline Schedule */}
        {activeTab === 'timeline' && (
          <TimelineView
            orders={orders}
            role={role}
            unreadMap={unreadMap}
            onStatusChange={handleStatusChange}
            onToggleFavorite={handleToggleFavorite}
            onTogglePaused={handleTogglePaused}
            onOpenChat={handleOpenChat}
          />
        )}

        {/* Tab 4: Analytics */}
        {activeTab === 'analytics' && <AnalyticsView orders={orders} />}

        {/* Tab 5: Messages & Active Notice Threads */}
        {activeTab === 'messages' && (
          <div className="space-y-4 max-w-4xl mx-auto animate-fade-in">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-white">Central de Avisos e Comunicação</h2>
                <p className="text-xs text-slate-400">
                  Acompanhamento de conversas e pendências sinalizadas entre PCP e Produção
                </p>
              </div>
              {totalUnreadCount > 0 && (
                <span className="px-3 py-1 bg-rose-600 text-white font-black text-xs rounded-full animate-pulse">
                  {totalUnreadCount} Novos Avisos
                </span>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                Nenhum aviso ou conversa aberta. Para iniciar um aviso, abra qualquer OP e clique em "Abrir Chat".
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-400">{msg.orderNumero}</span>
                        <span className="text-slate-400 font-medium truncate max-w-xs">{msg.orderDesc}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                      <strong>{msg.from === 'pcp' ? '📋 PCP:' : '🏭 Produção:'}</strong> {msg.text}
                    </p>

                    <div className="flex justify-end gap-2 pt-1 text-[11px]">
                      <button
                        onClick={() => {
                          const target = orders.find((o) => o.numero === msg.orderNumero);
                          if (target) handleOpenChat(target);
                        }}
                        className="px-3 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg font-bold cursor-pointer"
                      >
                        Responder no Chat
                      </button>

                      <button
                        onClick={() => handleArchiveMessage(msg.id)}
                        className="px-3 py-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg font-bold cursor-pointer"
                      >
                        Arquivar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Chat Drawer for Active OP */}
      {activeChatOrder && (
        <ChatDrawer
          order={activeChatOrder}
          messages={messages.filter((m) => m.orderNumero === activeChatOrder.numero || m.orderId === activeChatOrder.id)}
          role={role}
          onSendMsg={handleSendNewMessage}
          onReplyMsg={handleReplyMessage}
          onArchiveMsg={handleArchiveMessage}
          onDeleteMsg={handleDeleteMessage}
          onClose={() => setActiveChatOrder(null)}
        />
      )}

      {/* Nomus Import Modal */}
      <NomusImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportOrders}
      />

      {/* Print / Report Modal */}
      <ExportPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        orders={orders}
      />

      {/* Backup Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={handleRefreshDataFromStorage}
      />
    </div>
  );
}
