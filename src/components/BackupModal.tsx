import React, { useState } from 'react';
import { Download, Upload, RefreshCw, X, CheckCircle2, AlertTriangle, FileJson } from 'lucide-react';
import { storage } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [jsonInput, setJsonInput] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const dataStr = storage.exportBackupData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_PCP_Metalrib_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage({ text: 'Backup baixado com sucesso!', type: 'success' });
  };

  const handleRestoreJson = () => {
    if (!jsonInput.trim()) {
      setMessage({ text: 'Cole o JSON de backup.', type: 'error' });
      return;
    }

    const success = storage.restoreBackupData(jsonInput);
    if (success) {
      setMessage({ text: 'Dados restaurados com sucesso!', type: 'success' });
      onRefreshData();
      setTimeout(onClose, 1200);
    } else {
      setMessage({ text: 'Formato de JSON inválido.', type: 'error' });
    }
  };

  const handleResetSample = () => {
    if (window.confirm('Deseja realmente restaurar os dados de exemplo padrão?')) {
      storage.resetToSampleData();
      onRefreshData();
      setMessage({ text: 'Dados de exemplo restaurados com sucesso!', type: 'success' });
      setTimeout(onClose, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Backup e Restauração de Dados</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
              }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span>{message.text}</span>
            </div>
          )}

          {/* Download Backup */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              1. Exportar Backup Completo
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Gere um arquivo .json contendo todas as OPs, avisos, motivos de atraso e favoritos.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo .JSON</span>
            </button>
          </div>

          {/* Restore JSON */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              2. Cole o JSON para Restaurar
            </h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Cole o código JSON do backup aqui..."
              rows={3}
              className="w-full p-2.5 font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 outline-none"
            />
            <button
              onClick={handleRestoreJson}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Restaurar Backup Cole</span>
            </button>
          </div>

          {/* Reset to Demo */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-[11px] text-slate-500">Voltar para dados demonstrativos:</span>
            <button
              onClick={handleResetSample}
              className="px-3 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold cursor-pointer"
            >
              Restaurar Exemplo Metalrib
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
