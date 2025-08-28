
export interface Cliente {
  ter_nit: string;
  ter_raz: string;
  tot_val: number;
}

export interface Documento {
  ter_nit: string;
  clc_cod: string;
  doc_num: string;
  doc_fec: string;
  cta_cod: string;
  cta_nom: string;
  mov_val: number;
  mov_val_ext: number;
  mov_obs: string;
}

export interface DashboardStats {
  totalSaldo: number;
  totalClientes: number;
  documentosPendientes: number;
  promedioSaldo: number;
}

export interface TopCliente {
  ter_nit: string;
  ter_raz: string;
  tot_val: number;
}

export interface DocumentosPorClase {
  clc_cod: string;
  count: number;
  total: number;
}

export interface EvolucionMensual {
  mes: string;
  saldo: number;
}

export interface FilterOptions {
  searchTerm: string;
  sortBy: 'ter_nit' | 'ter_raz' | 'tot_val';
  sortOrder: 'asc' | 'desc';
  minSaldo?: number;
  maxSaldo?: number;
}
