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
import { sanitizeOrderQuantity } from './utils/nomusParser';
import {
  subscribeToOrders,
  subscribeToMessages,
  saveOrderToFirestore,
  saveOrdersBatchToFirestore,
  syncOrdersCollectionWithFirestore,
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
  const [messageSubTab, setMessageSubTab] = useState<'ativos' | 'arquivados'>('ativos');
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgPeriodFilter, setMsgPeriodFilter] = useState<'todos' | 'hoje' | '7dias' | '30dias'>('todos');

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
    const initialOrders = storage.getOrders().map(sanitizeOrderQuantity);
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
        const cleaned = remoteOrders.map(sanitizeOrderQuantity);
        setOrders(cleaned);
        storage.saveOrders(cleaned);
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
    setOrders(storage.getOrders().map(sanitizeOrderQuantity));
    setMessages(storage.getMessages());
    setUploadedFileName(storage.getUploadedFileName());
  };

  // Import Nomus ERP HTML Handler
  const handleImportOrders = async (rawImportedOrders: ProductionOrder[], fileName?: string) => {
    const prevOrders = orders;
    const importedOrders = rawImportedOrders.map(sanitizeOrderQuantity);

    const norm = (str: string) => (str || '').replace(/[\s\-_]/g, '').toUpperCase();

    // Merge strategy: Update Nomus data while preserving user notes, favorites, pauses and manual factory status
    const mergedList = importedOrders.map((imported) => {
      const impNormNum = norm(imported.numero);
      const impNormId = norm(imported.id);

      const existing = prevOrders.find((p) => {
        const pNormNum = norm(p.numero);
        const pNormId = norm(p.id);
        return p.id === imported.id || p.numero === imported.numero || (pNormNum && pNormNum === impNormNum) || (pNormId && pNormId === impNormId);
      });

      if (existing) {
        return {
          ...imported,
          id: existing.id,
          motivo_atraso: existing.motivo_atraso || imported.motivo_atraso || '',
          status: MANUAL_STATUS.includes(existing.status) ? existing.status : imported.status,
          status_nomus: imported.status_nomus || 'Liberada',
          favorito: existing.favorito || false,
          pausada: existing.pausada || false,
        };
      }
      return imported;
    });

    setOrders(mergedList);
    storage.saveOrders(mergedList);
    await syncOrdersCollectionWithFirestore(mergedList);

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

  const handleUnarchiveMessage = (msgId: string) => {
    let targetMsg: ChatMessage | null = null;
    const updated = messages.map((m) => {
      if (m.id === msgId) {
        targetMsg = { ...m, arquivada: false };
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white pb-12 transition-colors duration-200">
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
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Nomus Import Dropzone Quick Trigger Banner */}
        {role === 'pcp' && (
          <div
            onClick={() => setIsImportModalOpen(true)}
            className="p-3.5 bg-gradient-to-r from-blue-50 via-slate-50 to-indigo-50 dark:from-blue-900/60 dark:via-slate-900 dark:to-indigo-900/60 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-all shadow-sm dark:shadow-lg group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-600/30 border border-blue-300 dark:border-blue-400/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">Importar HTML do Nomus ERP</span>
                  {uploadedFileName && (
                    <span className="px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-400/30 rounded-full font-mono font-semibold">
                      📄 {uploadedFileName}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
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
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setOrdersSubTab('todas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  ordersSubTab === 'todas'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <span>Todas as OPs</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 dark:bg-white/20 text-slate-700 dark:text-white rounded-full">
                  {orders.filter((o) => !o.pausada).length}
                </span>
              </button>

              <button
                onClick={() => setOrdersSubTab('favoritas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  ordersSubTab === 'favoritas'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>Favoritas</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 dark:bg-black/20 text-slate-700 dark:text-slate-300 rounded-full">
                  {favoritesCount}
                </span>
              </button>

              <button
                onClick={() => setOrdersSubTab('pausadas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                  ordersSubTab === 'pausadas'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Pausadas</span>
                <span className="px-1.5 py-0.2 text-[10px] bg-slate-100 dark:bg-white/20 text-slate-700 dark:text-white rounded-full">
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
                    className={`p-3 rounded-2xl border cursor-pointer transition-all text-center select-none shadow-sm ${
                      isSelected
                        ? 'ring-2 ring-blue-500 scale-[1.02]'
                        : 'hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                    style={{
                      backgroundColor: darkMode ? info.bgColorDark : info.bgColorLight,
                      borderColor: isSelected ? info.color : (darkMode ? info.borderColorDark : info.borderColorLight),
                    }}
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
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

            {/* Search Bar & Category Filter Section */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {/* Search Box - guaranteed wide width */}
              <div className="relative w-full lg:w-96 shrink-0">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por OP, descrição, código do item, lote ou motivo..."
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills - smooth scrolling with custom thin scrollbar */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isCatSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span
                        className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${
                          isCatSelected ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
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
              <div className="py-16 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3">
                <Search className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma Ordem de Produção Encontrada</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tente alterar os filtros de busca, selecionar outra categoria ou importar um novo arquivo HTML do Nomus ERP.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatusFilter('todos');
                    setSelectedCategoryFilter('todas');
                  }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Limpar Filtros de Busca
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    role={role}
                    darkMode={darkMode}
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
            darkMode={darkMode}
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
            darkMode={darkMode}
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
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Central de Avisos e Comunicação</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhamento de conversas e pendências sinalizadas entre PCP e Produção
                  </p>
                </div>

                {/* Filter Subtabs: Ativos vs Arquivados */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setMessageSubTab('ativos')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      messageSubTab === 'ativos'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Ativos</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full font-mono">
                      {messages.filter((m) => !m.arquivada).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setMessageSubTab('arquivados')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      messageSubTab === 'arquivados'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>Arquivados</span>
                    <span className="px-1.5 py-0.2 text-[10px] bg-white/20 rounded-full font-mono">
                      {messages.filter((m) => m.arquivada).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* OP Search and Period Filters for Messages */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={msgSearchQuery}
                    onChange={(e) => setMsgSearchQuery(e.target.value)}
                    placeholder="Filtrar avisos por OP (ex: 018500), descrição ou conteúdo..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {msgSearchQuery && (
                    <button
                      onClick={() => setMsgSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Period selector */}
                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setMsgPeriodFilter('todos')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      msgPeriodFilter === 'todos'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Todo o Período
                  </button>
                  <button
                    onClick={() => setMsgPeriodFilter('hoje')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      msgPeriodFilter === 'hoje'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setMsgPeriodFilter('7dias')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      msgPeriodFilter === '7dias'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Últimos 7 dias
                  </button>
                  <button
                    onClick={() => setMsgPeriodFilter('30dias')}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      msgPeriodFilter === '30dias'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Últimos 30 dias
                  </button>
                </div>
              </div>
            </div>

            {(() => {
              const displayMessages = messages.filter((m) => {
                const isTabMatch = messageSubTab === 'arquivados' ? m.arquivada : !m.arquivada;
                if (!isTabMatch) return false;

                if (msgSearchQuery.trim()) {
                  const q = msgSearchQuery.toLowerCase().trim();
                  const matchesOp = m.orderNumero.toLowerCase().includes(q);
                  const matchesDesc = m.orderDesc.toLowerCase().includes(q);
                  const matchesText = m.text.toLowerCase().includes(q);
                  if (!matchesOp && !matchesDesc && !matchesText) return false;
                }

                if (msgPeriodFilter !== 'todos') {
                  const msgDate = new Date(m.timestamp).getTime();
                  const now = Date.now();
                  if (msgPeriodFilter === 'hoje') {
                    const startOfToday = new Date().setHours(0, 0, 0, 0);
                    if (msgDate < startOfToday) return false;
                  } else if (msgPeriodFilter === '7dias') {
                    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
                    if (msgDate < sevenDaysAgo) return false;
                  } else if (msgPeriodFilter === '30dias') {
                    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
                    if (msgDate < thirtyDaysAgo) return false;
                  }
                }

                return true;
              });

              if (displayMessages.length === 0) {
                return (
                  <div className="py-16 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs space-y-1">
                    <p className="font-bold">
                      {msgSearchQuery || msgPeriodFilter !== 'todos'
                        ? 'Nenhum aviso encontrado para os filtros aplicados.'
                        : messageSubTab === 'arquivados'
                        ? 'Nenhum aviso arquivado no momento.'
                        : 'Nenhum aviso ou conversa aberta em andamento.'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {(msgSearchQuery || msgPeriodFilter !== 'todos')
                        ? 'Tente alterar a busca de OP ou limpar o filtro de período.'
                        : 'Para iniciar um aviso em uma OP, abra a lista de OPs e clique em "Abrir Chat".'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {displayMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                            {msg.orderNumero}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-xs">
                            {msg.orderDesc}
                          </span>
                          {msg.arquivada && (
                            <span className="px-2 py-0.5 text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded font-bold">
                              Arquivado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {new Date(msg.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 leading-relaxed">
                        <strong className="text-blue-700 dark:text-blue-400">
                          {msg.from === 'pcp' ? '📋 PCP:' : '🏭 Produção:'}
                        </strong>{' '}
                        {msg.text}
                      </p>

                      <div className="flex justify-end items-center gap-2 pt-1 text-[11px]">
                        <button
                          onClick={() => {
                            const target = orders.find((o) => o.numero === msg.orderNumero);
                            if (target) handleOpenChat(target);
                          }}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-500/30 rounded-lg font-bold cursor-pointer transition-colors"
                        >
                          Abrir Chat da OP
                        </button>

                        {msg.arquivada ? (
                          <button
                            onClick={() => handleUnarchiveMessage(msg.id)}
                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            Desarquivar / Reabrir
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveMessage(msg.id)}
                            className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 border border-emerald-300 dark:border-emerald-500/30 rounded-lg font-bold cursor-pointer transition-colors"
                          >
                            Arquivar Aviso
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
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
