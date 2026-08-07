export type Role = 'pcp' | 'producao' | 'admin';

export type OrderStatusKey =
  | 'atrasada'
  | 'hoje'
  | 'produzindo_hoje'
  | 'falta_embalar'
  | 'embalada'
  | 'planejada'
  | 'req_parcial'
  | 'req_total'
  | 'liberada';

export interface OrderStatusInfo {
  label: string;
  short: string;
  color: string;
  bgColorDark: string;
  bgColorLight: string;
  borderColorDark: string;
  borderColorLight: string;
  icon: string;
  step: number;
}

export type CategoryKey =
  | 'todas'
  | 'folha'
  | 'batente'
  | 'porta_correr'
  | 'porta_giratoria'
  | 'porta_vai_vem'
  | 'porta_office'
  | 'trilho'
  | 'quadro_comando'
  | 'outros';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  icon: string;
}

export interface ProductionOrder {
  id: string; // e.g., "OP-017506-01"
  numero: string; // e.g., "OP 017506-01"
  descricao: string;
  codigo: string;
  lote: string;
  observacao: string;
  data_entrega: string; // "DD/MM/YYYY" or "YYYY-MM-DD"
  status: OrderStatusKey;
  status_nomus: string;
  quantidade: number;
  qtde_produzida: number;
  unidade?: string;
  categoria: CategoryKey;
  motivo_atraso?: string;
  favorito?: boolean;
  pausada?: boolean;
  prioridade?: 'alta' | 'media' | 'baixa';
  data_atualizacao?: string;
  historico_status?: Array<{
    status: OrderStatusKey;
    data: string;
    usuario: string;
    observacao?: string;
  }>;
}

export interface MessageReply {
  id: string;
  from: Role;
  text: string;
  timestamp: string;
  readByPcp?: boolean;
  readByProducao?: boolean;
  editado?: boolean;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  orderNumero: string;
  orderDesc: string;
  from: Role;
  text: string;
  timestamp: string;
  readByPcp?: boolean;
  readByProducao?: boolean;
  arquivada?: boolean;
  editado?: boolean;
  replies?: MessageReply[];
}

export interface ImportSummary {
  total: number;
  novas: number;
  atualizadas: number;
  atrasadas: number;
  hoje: number;
  emProducao: number;
  dataImportacao: string;
  nomeArquivo?: string;
}
