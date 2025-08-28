
import { Cliente, Documento, TopCliente, DocumentosPorClase, EvolucionMensual } from '@/types';

export const mockClientes: Cliente[] = [
  { ter_nit: '900123456-1', ter_raz: 'EMPRESA NACIONAL DE SERVICIOS S.A.S', tot_val: 125000000 },
  { ter_nit: '800987654-2', ter_raz: 'COMPAÑÍA INDUSTRIAL DEL CARIBE LTDA', tot_val: 89500000 },
  { ter_nit: '900456789-3', ter_raz: 'TECNOLOGÍA AVANZADA COLOMBIA S.A.', tot_val: 67800000 },
  { ter_nit: '800234567-4', ter_raz: 'DISTRIBUIDORA NACIONAL DEL PACÍFICO', tot_val: 54200000 },
  { ter_nit: '900345678-5', ter_raz: 'CONSTRUCTORA METROPOLITANA S.A.S', tot_val: 43600000 },
  { ter_nit: '800567890-6', ter_raz: 'COMERCIALIZADORA ANDINA LTDA', tot_val: 38900000 },
  { ter_nit: '900678901-7', ter_raz: 'LOGÍSTICA INTEGRAL DE COLOMBIA', tot_val: 32100000 },
  { ter_nit: '800789012-8', ter_raz: 'MANUFACTURAS DEL ORIENTE S.A.', tot_val: 28700000 },
  { ter_nit: '900890123-9', ter_raz: 'SERVICIOS EMPRESARIALES DEL SUR', tot_val: 22500000 },
  { ter_nit: '800901234-0', ter_raz: 'ALIANZA COMERCIAL BOGOTÁ S.A.S', tot_val: 18300000 },
];

export const mockDocumentos: Record<string, Documento[]> = {
  '900123456-1': [
    {
      ter_nit: '900123456-1',
      clc_cod: 'FAC',
      doc_num: 'F-2024-001',
      doc_fec: '2024-01-15',
      cta_cod: '13050501',
      cta_nom: 'CLIENTES NACIONALES',
      mov_val: 45000000,
      mov_val_ext: 45000000,
      mov_obs: 'Factura servicios enero 2024'
    },
    {
      ter_nit: '900123456-1',
      clc_cod: 'FAC',
      doc_num: 'F-2024-002',
      doc_fec: '2024-02-20',
      cta_cod: '13050501',
      cta_nom: 'CLIENTES NACIONALES',
      mov_val: 38000000,
      mov_val_ext: 38000000,
      mov_obs: 'Factura servicios febrero 2024'
    },
    {
      ter_nit: '900123456-1',
      clc_cod: 'FAC',
      doc_num: 'F-2024-003',
      doc_fec: '2024-03-10',
      cta_cod: '13050501',
      cta_nom: 'CLIENTES NACIONALES',
      mov_val: 42000000,
      mov_val_ext: 42000000,
      mov_obs: 'Factura servicios marzo 2024'
    }
  ],
  '800987654-2': [
    {
      ter_nit: '800987654-2',
      clc_cod: 'FAC',
      doc_num: 'F-2024-004',
      doc_fec: '2024-01-25',
      cta_cod: '13050501',
      cta_nom: 'CLIENTES NACIONALES',
      mov_val: 35000000,
      mov_val_ext: 35000000,
      mov_obs: 'Venta productos industriales'
    },
    {
      ter_nit: '800987654-2',
      clc_cod: 'NDC',
      doc_num: 'NC-2024-001',
      doc_fec: '2024-02-15',
      cta_cod: '13050501',
      cta_nom: 'CLIENTES NACIONALES',
      mov_val: 54500000,
      mov_val_ext: 54500000,
      mov_obs: 'Nota débito por intereses de mora'
    }
  ]
};

export const mockTopClientes: TopCliente[] = mockClientes.slice(0, 5);

export const mockDocumentosPorClase: DocumentosPorClase[] = [
  { clc_cod: 'FAC', count: 156, total: 890000000 },
  { clc_cod: 'NDC', count: 23, total: 145000000 },
  { clc_cod: 'REC', count: 8, total: 67000000 },
  { clc_cod: 'CXC', count: 12, total: 34000000 },
];

export const mockEvolucionMensual: EvolucionMensual[] = [
  { mes: 'Enero', saldo: 980000000 },
  { mes: 'Febrero', saldo: 1050000000 },
  { mes: 'Marzo', saldo: 1120000000 },
  { mes: 'Abril', saldo: 1080000000 },
  { mes: 'Mayo', saldo: 1200000000 },
  { mes: 'Junio', saldo: 1150000000 },
];
