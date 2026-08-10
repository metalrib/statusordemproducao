import { CategoryKey, OrderStatusKey, ProductionOrder } from '../types';
import { NOMUS_MAP } from '../constants';

export function detectCat(desc: string): CategoryKey {
  const d = (desc || '').toUpperCase();
  if (d.includes('TRILHO')) return 'trilho';
  if (d.includes('FOLHA')) return 'folha';
  if (
    d.startsWith('BAT ') ||
    d.includes('BAT GIRO') ||
    d.includes('BAT CORRER') ||
    d.includes('BATENTE')
  ) {
    return 'batente';
  }
  if (d.includes('PT VAI VEM') || d.includes('VAI-VEM') || d.includes('VAI VEM')) return 'porta_vai_vem';
  if (d.includes('PT OFFICE DOOR') || d.includes('OFFICE DOOR') || d.includes('OFFICE')) return 'porta_office';
  if (d.includes('PT COR') || d.includes('PORTA CORRER') || d.includes('CORRER')) return 'porta_correr';
  if (d.includes('PT GIR') || d.includes('PORTA GIRO') || d.includes('GIRATORIA') || d.includes('GIRATÓRIA')) return 'porta_giratoria';
  if (d.startsWith('QC ') || d.includes('QUADRO') || d.includes('COMANDO')) return 'quadro_comando';
  return 'outros';
}

export function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const p = dateStr.trim().split('/');
  if (p.length !== 3) return null;
  const yr = p[2].length === 2 ? '20' + p[2] : p[2];
  const d = new Date(`${yr}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function daysInfo(dateStr: string): { text: string; color: string; days: number; isOverdue: boolean; isToday: boolean } | null {
  const d = parseDateBR(dateStr);
  if (!d) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAbs = Math.abs(diffDays);
    return {
      text: `${daysAbs}d atraso`,
      color: '#EF4444',
      days: diffDays,
      isOverdue: true,
      isToday: false,
    };
  }
  if (diffDays === 0) {
    return {
      text: 'Hoje!',
      color: '#A855F7',
      days: 0,
      isOverdue: false,
      isToday: true,
    };
  }
  if (diffDays <= 3) {
    return {
      text: `${diffDays}d restantes`,
      color: '#F59E0B',
      days: diffDays,
      isOverdue: false,
      isToday: false,
    };
  }
  return {
    text: `${diffDays}d restantes`,
    color: '#64748B',
    days: diffDays,
    isOverdue: false,
    isToday: false,
  };
}

export function normalizeUnidade(umStr?: string, desc?: string): string {
  if (umStr) {
    const u = umStr.trim().toLowerCase();
    if (u === 'pc' || u === 'pcs' || u === 'pç' || u === 'pça' || u === 'peça' || u === 'peças' || u === 'un' || u === 'und' || u === 'unid' || u === 'unidade' || u === 'unidades') {
      return 'pc';
    }
    if (u === 'm2' || u === 'm²' || u === 'sqm') return 'm²';
    if (u === 'mm2' || u === 'mm²') return 'mm²';
    if (u === 'm' || u === 'metro' || u === 'metros' || u === 'ml') return 'm';
    if (u === 'kg' || u === 'kilo' || u === 'kilos') return 'kg';
    if (u === 'cx' || u === 'caixa') return 'cx';
    if (u) return u;
  }

  if (desc) {
    const d = desc.toUpperCase();
    if (d.includes('MM2') || d.includes('MM²')) return 'mm²';
    if (d.includes('M2') || d.includes('M²') || d.includes('METRO QUADRADO')) return 'm²';
  }

  return 'pc';
}

export function detectUnidade(desc: string, qty?: number): string {
  return normalizeUnidade(undefined, desc);
}

export function formatQuantity(val: number): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  if (Number.isInteger(val)) return val.toString();
  return val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function parseNomusNumber(valStr: string): number {
  if (!valStr) return 0;
  let str = valStr.trim();
  if (!str) return 0;

  str = str.replace(/[^0-9.,-]/g, '');
  if (!str) return 0;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    str = str.replace(',', '.');
  } else if (hasDot) {
    const parts = str.split('.');
    if (parts.length > 2) {
      str = str.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace('.', '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

const INVALID_DESC_KEYWORDS = [
  'liberada',
  'confirmada',
  'requisitada totalmente',
  'requisitada parcialmente',
  'encerrada',
  'cancelada',
  'em produção',
  'em producao',
  'planejada',
  'suspensa',
  'status',
  'situação',
  'situacao',
  'finalizada',
  'concluída',
  'concluida',
  'aguardando liberação',
  'aguardando liberacao',
];

const KNOWN_NOMUS_STATUS_KEYWORDS = [
  'liberada',
  'em produção',
  'em producao',
  'requisitada totalmente',
  'requisitada parcialmente',
  'planejada',
  'confirmada',
  'encerrada',
  'finalizada',
  'concluída',
  'concluida',
  'suspensa',
  'cancelada',
  'em elaboração',
  'em elaboracao',
  'aguardando liberação',
  'aguardando liberacao',
  'em separação',
  'em separacao',
  'terminada',
];

function isCodeString(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  return /^\d{2,4}[\.\-]\d{2,4}$/.test(s) || /^\d{3,6}$/.test(s);
}

function isInvalidDesc(str: string): boolean {
  if (!str) return true;
  const s = str.toLowerCase().trim();
  if (s.length < 2) return true;
  if (isCodeString(s)) return true;
  if (INVALID_DESC_KEYWORDS.some((k) => s === k || s === k + 's' || s.startsWith(k))) return true;
  return false;
}

function findStatusInRow(cells: string[]): string {
  for (const cell of cells) {
    if (!cell) continue;
    const lower = cell.toLowerCase().trim();
    for (const kw of KNOWN_NOMUS_STATUS_KEYWORDS) {
      if (lower === kw || lower.startsWith(kw)) {
        return cell.trim();
      }
    }
  }
  return '';
}

export function sanitizeOrderQuantity(order: ProductionOrder): ProductionOrder {
  let q = order.quantidade;
  let qp = order.qtde_produzida;

  if (q >= 1000 && q % 100 === 0 && Number.isInteger(q)) {
    q = q / 100;
  }

  if (qp >= 1000 && qp % 100 === 0 && Number.isInteger(qp)) {
    qp = qp / 100;
  }

  if (qp > q) {
    qp = q;
  }

  let desc = order.descricao || '';
  let cod = order.codigo || '';

  if (isInvalidDesc(desc)) {
    if (cod && !isInvalidDesc(cod)) {
      desc = cod;
      cod = '—';
    } else {
      desc = 'Sem descrição';
    }
  } else if (isCodeString(desc)) {
    if (cod && !isCodeString(cod) && !isInvalidDesc(cod)) {
      const tmp = desc;
      desc = cod;
      cod = tmp;
    }
  }

  const unidade = normalizeUnidade(order.unidade, desc);

  return {
    ...order,
    descricao: desc,
    codigo: cod,
    quantidade: q,
    qtde_produzida: qp,
    unidade,
  };
}

export function parseNomusHtml(htmlContent: string): { orders: ProductionOrder[]; rawCount: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  const orders: ProductionOrder[] = [];

  let colMap = {
    dt: -1,
    status: -1,
    desc: -1,
    cod: -1,
    lote: -1,
    obs: -1,
    op: -1,
    qtde: -1,
    qtdeP: -1,
    um: -1,
  };

  // Inspect headers dynamically across table rows
  for (const row of rows) {
    const headerCells = Array.from(row.querySelectorAll('th, td')).map((x) =>
      (x.textContent || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase()
    );
    if (headerCells.length < 3) continue;

    const headerText = headerCells.join(' ');
    if (
      headerText.includes('ordem') ||
      headerText.includes('op') ||
      headerText.includes('status') ||
      headerText.includes('situacao') ||
      headerText.includes('descri') ||
      headerText.includes('produto')
    ) {
      headerCells.forEach((text, idx) => {
        if (text.includes('entrega') || text.includes('previsao') || text === 'data' || text.startsWith('dt.')) {
          if (colMap.dt === -1) colMap.dt = idx;
        } else if (text.includes('status') || text.includes('situacao') || text.includes('situa')) {
          if (colMap.status === -1) colMap.status = idx;
        } else if (text.includes('descri') || text.includes('produto') || text.includes('item')) {
          if (colMap.desc === -1) colMap.desc = idx;
        } else if (text.includes('cod') || text.includes('codigo')) {
          if (colMap.cod === -1) colMap.cod = idx;
        } else if (text.includes('lote')) {
          if (colMap.lote === -1) colMap.lote = idx;
        } else if (text.includes('obs') || text.includes('observa')) {
          if (colMap.obs === -1) colMap.obs = idx;
        } else if ((text.includes('op') || text.includes('ordem') || text.includes('num. op')) && !text.includes('entrega')) {
          if (colMap.op === -1) colMap.op = idx;
        } else if (text.includes('produz') || text.includes('execut')) {
          if (colMap.qtdeP === -1) colMap.qtdeP = idx;
        } else if (text.includes('qtde') || text.includes('quant') || text.includes('qtd')) {
          if (colMap.qtde === -1) colMap.qtde = idx;
        } else if (text.includes('um') || text.includes('u.m') || text.includes('unidade') || text.includes('unid')) {
          if (colMap.um === -1) colMap.um = idx;
        }
      });

      if (colMap.op !== -1 || colMap.status !== -1 || colMap.desc !== -1) {
        break;
      }
    }
  }

  let lastDate = '';
  let lastStatus = '';
  let lastDesc = '';
  let lastCod = '';

  let rawCount = 0;

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td, th')).map((x) =>
      (x.textContent || '').trim()
    );

    if (cells.length < 3) continue;

    const rowText = cells.join(' ').toLowerCase();

    // Skip header rows
    if (
      (rowText.includes('status') || rowText.includes('situacao')) &&
      (rowText.includes('descri') || rowText.includes('produto')) &&
      (rowText.includes('ordem') || rowText.includes('op'))
    ) {
      continue;
    }
    if (rowText.includes('previsao de entrega') && (rowText.includes('situacao') || rowText.includes('status'))) {
      continue;
    }

    // 1. Locate OP
    let op = colMap.op !== -1 && cells[colMap.op] ? cells[colMap.op] : '';
    let opIndex = colMap.op !== -1 && op ? colMap.op : -1;

    if (!op || (!op.toUpperCase().includes('OP') && !/^\d{5,}/.test(op))) {
      opIndex = cells.findIndex((c) => {
        const cu = c.toUpperCase().trim();
        return (
          cu.startsWith('OP ') ||
          cu.startsWith('OP-') ||
          cu.startsWith('OP/') ||
          cu.startsWith('OP0') ||
          /^\d{5,7}(-\d{1,2})?$/.test(cu)
        );
      });
      if (opIndex !== -1) {
        op = cells[opIndex];
      }
    }

    if (!op || (!op.toUpperCase().includes('OP') && !op.match(/^[0-9]{5,}/))) {
      continue;
    }
    if (op.toLowerCase().includes('resumo') || op.toLowerCase().includes('total')) {
      continue;
    }

    rawCount++;

    // 2. Extract Status Nomus
    let st = colMap.status !== -1 && cells[colMap.status] ? cells[colMap.status] : '';
    if (!st || isInvalidDesc(st)) {
      const foundSt = findStatusInRow(cells);
      if (foundSt) {
        st = foundSt;
      }
    }

    // 3. Extract Delivery Date
    let dt = colMap.dt !== -1 && cells[colMap.dt] ? cells[colMap.dt] : '';
    if (!dt || !/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dt.trim())) {
      const dateCell = cells.find((c) => /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(c.trim()));
      if (dateCell) dt = dateCell;
    }

    // 4. Extract Description & Code
    let desc = colMap.desc !== -1 && cells[colMap.desc] ? cells[colMap.desc] : '';
    let cod = colMap.cod !== -1 && cells[colMap.cod] ? cells[colMap.cod] : '';

    if (isInvalidDesc(desc)) {
      if (cod && !isInvalidDesc(cod)) {
        desc = cod;
        cod = '';
      } else {
        const textCell = cells.find((c) => {
          if (!c || c.length < 3) return false;
          if (isInvalidDesc(c)) return false;
          if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(c)) return false;
          if (c.toUpperCase().includes('OP')) return false;
          return true;
        });
        if (textCell) {
          desc = textCell;
        } else if (lastDesc && !isInvalidDesc(lastDesc)) {
          desc = lastDesc;
        } else {
          desc = 'Sem descrição';
        }
      }
    }

    if (isCodeString(desc)) {
      if (cod && !isCodeString(cod) && !isInvalidDesc(cod)) {
        const temp = desc;
        desc = cod;
        cod = temp;
      }
    }

    // 5. Extract Lot & Observation
    let lote = colMap.lote !== -1 && cells[colMap.lote] ? cells[colMap.lote] : '';
    let obs = colMap.obs !== -1 && cells[colMap.obs] ? cells[colMap.obs] : '';

    // 6. Extract Quantities
    let qtdeStr = colMap.qtde !== -1 && cells[colMap.qtde] ? cells[colMap.qtde] : '';
    let qtdePStr = colMap.qtdeP !== -1 && cells[colMap.qtdeP] ? cells[colMap.qtdeP] : '';
    let umRaw = colMap.um !== -1 && cells[colMap.um] ? cells[colMap.um] : '';

    if (!qtdeStr && opIndex !== -1 && opIndex + 1 < cells.length) {
      qtdeStr = cells[opIndex + 1];
    }
    if (!qtdePStr && opIndex !== -1 && opIndex + 2 < cells.length) {
      qtdePStr = cells[opIndex + 2];
    }

    if (dt) lastDate = dt;
    if (st && !isInvalidDesc(st)) lastStatus = st;
    if (desc && !isInvalidDesc(desc)) lastDesc = desc;
    if (cod && isCodeString(cod)) lastCod = cod;

    const currentNomusStatus = st || lastStatus || 'Liberada';
    const nomusKey = currentNomusStatus.toLowerCase().trim();

    let calculatedStatus: OrderStatusKey = 'planejada';
    for (const [k, v] of Object.entries(NOMUS_MAP)) {
      if (nomusKey.includes(k) || k.includes(nomusKey)) {
        calculatedStatus = v;
        break;
      }
    }

    const deliveryDateStr = dt || lastDate;
    const parsedDate = parseDateBR(deliveryDateStr);

    if (parsedDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (
        parsedDate < todayStart &&
        calculatedStatus !== 'embalada' &&
        calculatedStatus !== 'produzindo_hoje' &&
        calculatedStatus !== 'falta_embalar'
      ) {
        calculatedStatus = 'atrasada';
      } else if (
        parsedDate >= todayStart &&
        parsedDate <= todayEnd &&
        calculatedStatus !== 'embalada' &&
        calculatedStatus !== 'produzindo_hoje' &&
        calculatedStatus !== 'falta_embalar'
      ) {
        calculatedStatus = 'hoje';
      }
    }

    const q = parseNomusNumber(qtdeStr);
    const qp = parseNomusNumber(qtdePStr);
    const finalDesc = !isInvalidDesc(desc) ? desc : (!isInvalidDesc(lastDesc) ? lastDesc : 'Sem descrição');
    const finalCod = (cod && isCodeString(cod)) ? cod : (lastCod || '—');
    const unidad = normalizeUnidade(umRaw, finalDesc);

    const opClean = op.replace(/\s+/g, ' ').trim();
    const opId = opClean.replace(/\s+/g, '-').replace('/', '-');

    const newOrder: ProductionOrder = {
      id: opId,
      numero: opClean,
      descricao: finalDesc,
      codigo: finalCod,
      lote: lote || '',
      observacao: obs || '',
      data_entrega: deliveryDateStr || '',
      status: calculatedStatus,
      status_nomus: currentNomusStatus,
      quantidade: q,
      qtde_produzida: qp,
      unidade: unidad,
      categoria: detectCat(finalDesc),
      motivo_atraso: '',
      favorito: false,
      pausada: false,
      prioridade: calculatedStatus === 'atrasada' ? 'alta' : 'media',
      data_atualizacao: new Date().toISOString(),
    };

    orders.push(sanitizeOrderQuantity(newOrder));
  }

  return { orders, rawCount };
}
