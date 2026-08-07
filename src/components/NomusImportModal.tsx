import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Code, RefreshCw, HelpCircle } from 'lucide-react';
import { parseNomusHtml } from '../utils/nomusParser';
import { ProductionOrder, ImportSummary } from '../types';

interface NomusImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (orders: ProductionOrder[], fileName?: string) => void;
}

export const NomusImportModal: React.FC<NomusImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [pasteHtml, setPasteHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewSummary, setPreviewSummary] = useState<ImportSummary | null>(null);
  const [parsedOrders, setParsedOrders] = useState<ProductionOrder[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processHtmlText = (htmlText: string, fileName = 'Importação Nomus') => {
    setLoading(true);
    setError(null);

    try {
      const { orders, rawCount } = parseNomusHtml(htmlText);

      if (orders.length === 0) {
        setError(
          `Não foi possível encontrar OPs válidas no HTML fornecido (linhas lidas: ${rawCount}). Verifique se exportou a página correta do Nomus ERP.`
        );
        setPreviewSummary(null);
        setParsedOrders([]);
      } else {
        const delayed = orders.filter((o) => o.status === 'atrasada').length;
        const today = orders.filter((o) => o.status === 'hoje').length;
        const inProd = orders.filter((o) => o.status === 'produzindo_hoje').length;

        setParsedOrders(orders);
        setUploadedFileName(fileName);
        setPreviewSummary({
          total: orders.length,
          novas: orders.length,
          atualizadas: 0,
          atrasadas: delayed,
          hoje: today,
          emProducao: inProd,
          dataImportacao: new Date().toLocaleDateString('pt-BR'),
          nomeArquivo: fileName,
        });
      }
    } catch (e: any) {
      setError(`Erro ao processar HTML: ${e?.message || 'Formato inválido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processHtmlText(content, file.name);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        processHtmlText(content, file.name);
      };
      reader.readAsText(file, file.name);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteHtml.trim()) {
      setError('Cole o código HTML da página do Nomus.');
      return;
    }
    processHtmlText(pasteHtml, 'Copiado_Nomus.html');
  };

  const handleConfirmImport = () => {
    if (parsedOrders.length > 0) {
      onImport(parsedOrders, uploadedFileName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Importar Ordens do Nomus ERP</h2>
              <p className="text-xs text-slate-400">
                Selecione o arquivo .html salvo ou cole o código da página
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Tabs for File vs Paste */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Arquivo HTML (.html / .htm)</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'paste'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Colar Código HTML</span>
            </button>
          </div>

          {activeTab === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Arraste o arquivo HTML do Nomus aqui
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ou clique para selecionar no seu computador
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-md">
                Formatos aceitos: .html, .htm
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={pasteHtml}
                onChange={(e) => setPasteHtml(e.target.value)}
                placeholder="Cole o código HTML copiado do Nomus aqui (ex: <table>...</table> ou CTRL+A, CTRL+C na página do Nomus)..."
                rows={6}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={loading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Processar Código HTML</span>
              </button>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <div>
                <strong className="block font-bold">Aviso no Processamento</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {previewSummary && (
            <div className="p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Resumo do Arquivo Nomus
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {uploadedFileName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 font-semibold">Total de OPs</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {previewSummary.total}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Atrasadas</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
                    {previewSummary.atrasadas}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Prazo Hoje</div>
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                    {previewSummary.hoje}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Em Produção</div>
                  <div className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {previewSummary.emProducao}
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                💡 <strong>Manutenção Inteligente:</strong> Ao importar, o sistema preservará os motivos de atraso cadastrados anteriormente, favoritos, pausadas e alterações manuais de status feitas por Eduardo/Produção.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Como exportar do Nomus ERP:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Acesse a tela de <strong>Ordens de Produção</strong> no Nomus.</li>
              <li>Filtre as OPs desejadas da fábrica.</li>
              <li>Clique com o botão direito na página e selecione <strong>Salvar como... (HTML completo / Apenas HTML)</strong> ou pressione <code>CTRL + S</code>.</li>
              <li>Carregue o arquivo salvo neste modal.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedOrders.length === 0}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              parsedOrders.length > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmar e Atualizar Sistema ({parsedOrders.length} OPs)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
