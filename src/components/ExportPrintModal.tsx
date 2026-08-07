import React from 'react';
import { Printer, Download, X, FileSpreadsheet, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { ProductionOrder } from '../types';
import { STATUS_CONFIG } from '../constants';
import { formatQuantity, detectUnidade } from '../utils/nomusParser';

interface ExportPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ProductionOrder[];
}

export const ExportPrintModal: React.FC<ExportPrintModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'Numero OP',
      'Descricao',
      'Codigo',
      'Lote',
      'Prazo Entrega',
      'Status Atual',
      'Status Nomus',
      'Quantidade Total',
      'Qtde Produzida',
      'Categoria',
      'Motivo Atraso',
    ];

    const rows = orders.map((o) => [
      `"${o.numero}"`,
      `"${o.descricao.replace(/"/g, '""')}"`,
      `"${o.codigo}"`,
      `"${o.lote}"`,
      `"${o.data_entrega}"`,
      `"${STATUS_CONFIG[o.status]?.label || o.status}"`,
      `"${o.status_nomus}"`,
      o.quantidade,
      o.qtde_produzida,
      `"${o.categoria}"`,
      `"${(o.motivo_atraso || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Relatorio_PCP_Metalrib_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const delayed = orders.filter((o) => o.status === 'atrasada');
  const today = orders.filter((o) => o.status === 'hoje');
  const inProd = orders.filter((o) => o.status === 'produzindo_hoje');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:text-black">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header - Hidden when printing */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <Printer className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-white">Relatório de Alinhamento Diário PCP</h2>
              <p className="text-xs text-slate-400">
                Visualização para impressão e exportação em CSV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel/CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 print:p-8 print:text-black font-sans">
          {/* Company Branding */}
          <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-slate-800 print:border-black">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-slate-900 dark:text-white print:text-black">
                METALRIB PORTAS FRIGORÍFICAS
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 print:text-gray-600 font-medium">
                Relatório de Acompanhamento de Ordens de Produção & Prazos
              </p>
            </div>

            <div className="text-right text-xs font-mono text-slate-500 dark:text-slate-400 print:text-gray-700">
              <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
              <div>Hora: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 print:border-gray-400 print:bg-gray-100">
              <div className="text-slate-500 dark:text-slate-400 print:text-gray-600 font-semibold">Total de OPs</div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white print:text-black">{orders.length}</div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 print:border-gray-400 print:bg-gray-100">
              <div className="text-rose-700 dark:text-rose-400 print:text-black font-semibold">Atrasadas</div>
              <div className="text-lg font-black font-mono text-rose-700 dark:text-rose-400 print:text-black">{delayed.length}</div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800 print:border-gray-400 print:bg-gray-100">
              <div className="text-purple-700 dark:text-purple-400 print:text-black font-semibold">Prazo Hoje</div>
              <div className="text-lg font-black font-mono text-purple-700 dark:text-purple-400 print:text-black">{today.length}</div>
            </div>

            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-800 print:border-gray-400 print:bg-gray-100">
              <div className="text-cyan-700 dark:text-cyan-400 print:text-black font-semibold">Produzindo Hoje</div>
              <div className="text-lg font-black font-mono text-cyan-700 dark:text-cyan-400 print:text-black">{inProd.length}</div>
            </div>
          </div>

          {/* Printable Orders Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-300 dark:border-slate-700 print:bg-gray-200 print:text-black print:border-black">
                  <th className="p-2 font-bold font-mono">OP</th>
                  <th className="p-2 font-bold">Descrição do Produto</th>
                  <th className="p-2 font-bold">Código</th>
                  <th className="p-2 font-bold">Prazo</th>
                  <th className="p-2 font-bold">Qtde Total</th>
                  <th className="p-2 font-bold">Status</th>
                  <th className="p-2 font-bold">Motivo Atraso / Obs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-gray-400">
                {orders.map((o) => {
                  const sInfo = STATUS_CONFIG[o.status] || STATUS_CONFIG.planejada;

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 print:hover:bg-transparent"
                    >
                      <td className="p-2 font-mono font-bold">{o.numero}</td>
                      <td className="p-2 font-medium">{o.descricao}</td>
                      <td className="p-2 font-mono text-slate-500">{o.codigo}</td>
                      <td className="p-2 font-bold">{o.data_entrega || '—'}</td>
                      <td className="p-2 font-bold font-mono">
                        {formatQuantity(o.quantidade)} {o.unidade || detectUnidade(o.descricao, o.quantidade)}
                      </td>
                      <td className="p-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase print:border print:border-black print:bg-transparent print:text-black"
                          style={{ backgroundColor: `${sInfo.color}20`, color: sInfo.color }}
                        >
                          {sInfo.label}
                        </span>
                      </td>
                      <td className="p-2 text-rose-600 dark:text-rose-400 font-medium">
                        {o.motivo_atraso || o.observacao || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
