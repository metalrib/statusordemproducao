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

export function parseNomusNumber(valStr: string): number {
  if (!valStr) return 0;
  let str = valStr.trim();
  if (!str) return 0;

  // Remove currency, spaces, or extra non-numeric characters keeping digits, dot, comma, minus
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
    // e.g. "4,000" or "4,00" or "100,00" -> comma is decimal point in BR
    str = str.replace(',', '.');
  } else if (hasDot) {
    // e.g. "4.000" or "4.00" or "2.000" or "100.000" or "1.000.000"
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots e.g. 1.000.000 -> thousand separators
      str = str.replace(/\./g, '');
    } else {
      // Single dot: e.g. "4.000", "2.000", "1.000" -> in Nomus exports single dot represents decimals
      // parseFloat("4.000") = 4, parseFloat("2.000") = 2, parseFloat("1.000") = 1
    }
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export function sanitizeOrderQuantity(order: ProductionOrder): ProductionOrder {
  let q = order.quantidade;
  let qp = order.qtde_produzida;

  // Auto-correct previously parsed corrupt values like 1000, 2000, 4000, 400, 100
  if (q >= 1000 && q % 1000 === 0) {
    q = q / 1000;
  } else if (q >= 100 && q % 100 === 0 && q < 1000) {
    q = q / 100;
  }

  if (qp >= 1000 && qp % 1000 === 0) {
    qp = qp / 1000;
  } else if (qp >= 100 && qp % 100 === 0 && qp < 1000 && qp > q) {
    qp = qp / 100;
  }

  if (qp > q) {
    qp = q;
  }

  return {
    ...order,
    quantidade: q,
    qtde_produzida: qp,
  };
}

export function parseNomusHtml(htmlContent: string): { orders: ProductionOrder[]; rawCount: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  const orders: ProductionOrder[] = [];

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

    // Standard Nomus export mapping:
    // Cell 0: Date
    // Cell 1: Status
    // Cell 2: Description
    // Cell 3: Code
    // Cell 4: Lot
    // Cell 5: Observation
    // Cell 6: OP Number (e.g., OP 017506-01)
    // Cell 7: Quantity
    // Cell 8: Quantity Produced
    let dt = cells[0] || '';
    let st = cells[1] || '';
    let desc = cells[2] || '';
    let cod = cells[3] || '';
    let lote = cells[4] || '';
    let obs = cells[5] || '';
    let op = cells[6] || '';
    let qtdeStr = cells[7] || '0';
    let qtdePStr = cells[8] || '0';

    // If cells length is 7 or 8, find OP column
    if (!op || !op.toUpperCase().includes('OP')) {
      const opIndex = cells.findIndex((c) => c.toUpperCase().startsWith('OP ') || c.toUpperCase().startsWith('OP-') || c.toUpperCase().startsWith('OP0'));
      if (opIndex !== -1) {
        op = cells[opIndex];
        // Shift parsing context dynamically
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

    const opClean = op.replace(/\s+/g, ' ').trim();
    const opId = opClean.replace(/\s+/g, '-').replace('/', '-');

    const newOrder: ProductionOrder = {
      id: opId,
      numero: opClean,
      descricao: desc || lastDesc || 'Sem descrição',
      codigo: cod || lastCod || '—',
      lote: lote || '',
      observacao: obs || '',
      data_entrega: deliveryDateStr || '',
      status: calculatedStatus,
      status_nomus: currentNomusStatus || 'Planejada',
      quantidade: q,
      qtde_produzida: qp,
      categoria: detectCat(desc || lastDesc),
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
