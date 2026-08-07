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

  // Keep only digits, dot, comma, minus
  str = str.replace(/[^0-9.,-]/g, '');
  if (!str) return 0;

  const hasDot = str.includes('.');
  const hasComma = str.includes(',');

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Brazilian format: 1.250,00 -> dot is thousands, comma is decimal
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: 1,250.00
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Brazilian format with decimal comma: "972,00" -> "972.00", "48,00" -> "48.00", "1,66" -> "1.66"
    str = str.replace(',', '.');
  } else if (hasDot) {
    const parts = str.split('.');
    if (parts.length > 2) {
      str = str.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3) {
      // e.g. "1.000" in Brazilian notation
      str = str.replace('.', '');
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function sanitizeOrderQuantity(order: ProductionOrder): ProductionOrder {
  let q = order.quantidade;
  let qp = order.qtde_produzida;

  // Fix previously corrupted values in storage (e.g. 97200 -> 972, 4800 -> 48, 2000 -> 20)
  if (q >= 1000 && q % 100 === 0 && Number.isInteger(q)) {
    q = q / 100;
  }

  if (qp >= 1000 && qp % 100 === 0 && Number.isInteger(qp)) {
    qp = qp / 100;
  }

  if (qp > q) {
    qp = q;
  }

  const unidade = normalizeUnidade(order.unidade, order.descricao);

  return {
    ...order,
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

  // Inspect headers dynamically
  for (const row of rows) {
    const headerCells = Array.from(row.querySelectorAll('th, td')).map((x) =>
      (x.textContent || '').trim().toLowerCase()
    );
    const headerText = headerCells.join(' ');

    if (
      (headerText.includes('ordem') || headerText.includes('op')) &&
      (headerText.includes('descri') || headerText.includes('produto') || headerText.includes('item'))
    ) {
      headerCells.forEach((text, idx) => {
        if (text.includes('entrega') || text.includes('previsão') || text === 'data') colMap.dt = idx;
        else if (text.includes('status') || text.includes('situação')) colMap.status = idx;
        else if (text.includes('descri') || text.includes('produto') || text.includes('item')) colMap.desc = idx;
        else if (text.includes('cód') || text.includes('cod')) colMap.cod = idx;
        else if (text.includes('lote')) colMap.lote = idx;
        else if (text.includes('obs') || text.includes('observa')) colMap.obs = idx;
        else if (text.includes('op') || text.includes('ordem')) colMap.op = idx;
        else if (text.includes('um') || text.includes('u.m') || text.includes('unidade') || text.includes('unid')) colMap.um = idx;
        else if (text.includes('produz') || text.includes('execut')) colMap.qtdeP = idx;
        else if (text.includes('qtde') || text.includes('quant') || text.includes('qtd')) colMap.qtde = idx;
      });
      break;
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

    if (cells.length < 5) continue;

    // Check if header row
    const rowText = cells.join(' ').toLowerCase();
    if (rowText.includes('status') && rowText.includes('descrição') && rowText.includes('ordem')) {
      continue;
    }

    let dt = colMap.dt !== -1 ? cells[colMap.dt] || '' : cells[0] || '';
    let st = colMap.status !== -1 ? cells[colMap.status] || '' : cells[1] || '';
    let desc = colMap.desc !== -1 ? cells[colMap.desc] || '' : cells[2] || '';
    let cod = colMap.cod !== -1 ? cells[colMap.cod] || '' : cells[3] || '';
    let lote = colMap.lote !== -1 ? cells[colMap.lote] || '' : cells[4] || '';
    let obs = colMap.obs !== -1 ? cells[colMap.obs] || '' : cells[5] || '';
    let op = colMap.op !== -1 ? cells[colMap.op] || '' : cells[6] || '';
    let qtdeStr = colMap.qtde !== -1 ? cells[colMap.qtde] || '0' : cells[7] || '0';
    let qtdePStr = colMap.qtdeP !== -1 ? cells[colMap.qtdeP] || '0' : cells[8] || '0';
    let umRaw = colMap.um !== -1 ? cells[colMap.um] || '' : '';

    // If OP column not identified properly, search for cell starting with OP
    if (!op || !op.toUpperCase().includes('OP')) {
      const opIndex = cells.findIndex(
        (c) =>
          c.toUpperCase().startsWith('OP ') ||
          c.toUpperCase().startsWith('OP-') ||
          c.toUpperCase().startsWith('OP0')
      );
      if (opIndex !== -1) {
        op = cells[opIndex];
        if (opIndex > 0) qtdeStr = cells[opIndex + 1] || qtdeStr;
        if (opIndex > 1) qtdePStr = cells[opIndex + 2] || qtdePStr;
      }
    }

    if (!op || (!op.toUpperCase().includes('OP') && !op.match(/^[0-9]{5,}/))) {
      continue;
    }
    if (op.toLowerCase().includes('resumo') || op.toLowerCase().includes('total')) {
      continue;
    }

    rawCount++;

    if (dt) lastDate = dt;
    if (st) lastStatus = st;
    if (desc) lastDesc = desc;
    if (cod) lastCod = cod;

    const currentNomusStatus = st || lastStatus;
    const nomusKey = currentNomusStatus.toLowerCase().trim();
    let calculatedStatus: OrderStatusKey = NOMUS_MAP[nomusKey] || 'planejada';

    const deliveryDateStr = dt || lastDate;
    const parsedDate = parseDateBR(deliveryDateStr);

    if (parsedDate) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      if (parsedDate < todayStart) {
        calculatedStatus = 'atrasada';
      } else if (parsedDate >= todayStart && parsedDate <= todayEnd) {
        calculatedStatus = 'hoje';
      }
    }

    const q = parseNomusNumber(qtdeStr);
    const qp = parseNomusNumber(qtdePStr);
    const finalDesc = desc || lastDesc || 'Sem descrição';
    const unidad = normalizeUnidade(umRaw, finalDesc);

    const opClean = op.replace(/\s+/g, ' ').trim();
    const opId = opClean.replace(/\s+/g, '-').replace('/', '-');

    const newOrder: ProductionOrder = {
      id: opId,
      numero: opClean,
      descricao: finalDesc,
      codigo: cod || lastCod || '—',
      lote: lote || '',
      observacao: obs || '',
      data_entrega: deliveryDateStr || '',
      status: calculatedStatus,
      status_nomus: currentNomusStatus || 'Planejada',
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
