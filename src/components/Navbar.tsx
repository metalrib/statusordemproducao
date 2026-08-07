import React from 'react';
import {
  Factory,
  FileSpreadsheet,
  BarChart3,
  Kanban,
  Clock,
  MessageSquare,
  Moon,
  Sun,
  LogOut,
  Download,
  Upload,
  Printer,
  Shield,
  Filter,
} from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  role: Role;
  activeTab: 'grid' | 'kanban' | 'timeline' | 'analytics' | 'messages';
  setActiveTab: (tab: 'grid' | 'kanban' | 'timeline' | 'analytics' | 'messages') => void;
  unreadCount: number;
  totalOrdersCount: number;
  delayedCount: number;
  todayCount: number;
  inProductionCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenImport: () => void;
  onOpenPrintModal: () => void;
  onOpenBackupModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  activeTab,
  setActiveTab,
  unreadCount,
  totalOrdersCount,
  delayedCount,
  todayCount,
  inProductionCount,
  darkMode,
  onToggleDarkMode,
  onOpenImport,
  onOpenPrintModal,
  onOpenBackupModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Role Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-black text-xl">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base sm:text-lg text-slate-900 dark:text-white">
                  METALRIB
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    role === 'pcp'
                      ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30'
                      : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30'
                  }`}
                >
                  {role === 'pcp' ? 'PCP' : 'Eduardo (Produção)'}
                </span>
                <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                  Firebase Sincronizado
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Gestão de Ordens de Produção & Prazos
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Lista de OPs ({totalOrdersCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Quadro Kanban</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Cronograma</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Análise de Atrasos</span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'messages'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Avisos</span>
              {unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black bg-rose-500 text-white rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-2">
            {role === 'pcp' && (
              <button
                onClick={onOpenImport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                title="Importar HTML exportado do Nomus"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Importar Nomus</span>
              </button>
            )}

            <button
              onClick={onOpenPrintModal}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              title="Relatório para Reunião Matinal / Imprimir"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenBackupModal}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              title="Backup / Restaurar Dados"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleDarkMode}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
              title={darkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              title="Trocar perfil ou sair"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar */}
        <div className="flex md:hidden items-center justify-between gap-1 py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>OPs ({totalOrdersCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'timeline' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Atrasos</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'messages' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Avisos</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-rose-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
