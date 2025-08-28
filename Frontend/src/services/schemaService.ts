
// Servicio para gestionar el esquema de la tabla con_his
export interface TableColumn {
  name: string;
  type: string;
  description: string;
  isNumeric: boolean;
  isDate: boolean;
  isText: boolean;
}

export interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  type: 'text' | 'number' | 'date';
}

export interface QueryConfiguration {
  selectedFields: string[];
  conditions: QueryCondition[];
  orderBy: string[];
  groupBy: string[];
  limit?: number;
}

// Columnas de la tabla con_his basadas en el esquema típico
const CON_HIS_COLUMNS: TableColumn[] = [
  { name: 'id', type: 'integer', description: 'Id del registro', isNumeric: true, isDate: false, isText: false },
  { name: 'adm_ciaid', type: 'integer', description: 'Compañía. Id asignado a la compañía.', isNumeric: true, isDate: false, isText: false },
  { name: 'suc_cod', type: 'varchar', description: 'Agencia. Sucursal/Agencia.', isNumeric: false, isDate: false, isText: true },
  { name: 'clc_cod', type: 'varchar', description: 'Clase. Clase de Documento.', isNumeric: false, isDate: false, isText: true },
  { name: 'doc_num', type: 'numeric', description: 'Documento. Número del Documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_fec', type: 'date', description: 'Fecha. Fecha del Documento.', isNumeric: false, isDate: true, isText: false },
  { name: 'doc_tot_deb', type: 'numeric', description: 'Débitos. Total débitos del documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_tot_crd', type: 'numeric', description: 'Créditos. Total créditos del documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_pre', type: 'varchar', description: 'Prefijo exigido por la Administración de Impuestos.', isNumeric: false, isDate: false, isText: true },
  { name: 'doc_num_ref', type: 'numeric', description: 'Número del Documento del tercero.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_fec_ref', type: 'date', description: 'Fecha del Documento del tercero.', isNumeric: false, isDate: true, isText: false },
  { name: 'clc_ord', type: 'smallint', description: 'Clase de Orden de Compra.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_com_ven', type: 'varchar', description: 'Indicador de compra/venta.', isNumeric: false, isDate: false, isText: true },
  { name: 'ter_res', type: 'varchar', description: 'No. Resolución que autoriza la expedición.', isNumeric: false, isDate: false, isText: true },
  { name: 'doc_ide', type: 'varchar', description: 'Identificación adicional del documento.', isNumeric: false, isDate: false, isText: true },
  { name: 'doc_obs', type: 'varchar', description: 'Observaciones del documento.', isNumeric: false, isDate: false, isText: true },
  { name: 'cor_ano', type: 'smallint', description: 'Año del documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'cor_mes', type: 'smallint', description: 'Mes del documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'cor_dia', type: 'smallint', description: 'Día del documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_ori', type: 'varchar', description: 'Origen del documento.', isNumeric: false, isDate: false, isText: true },
  { name: 'usr_cod', type: 'varchar', description: 'Código de usuario.', isNumeric: false, isDate: false, isText: true },
  { name: 'usr_fec', type: 'date', description: 'Fecha de grabación.', isNumeric: false, isDate: true, isText: false },
  { name: 'usr_hor', type: 'integer', description: 'Hora de grabación.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_est', type: 'smallint', description: 'Estado del documento.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_cons', type: 'smallint', description: 'Consecutivo de la partida.', isNumeric: true, isDate: false, isText: false },
  { name: 'cta_cod', type: 'varchar', description: 'Código de cuenta.', isNumeric: false, isDate: false, isText: true },
  { name: 'mov_det', type: 'varchar', description: 'Detalle del movimiento.', isNumeric: false, isDate: false, isText: true },
  { name: 'ter_nit', type: 'varchar', description: 'NIT del tercero.', isNumeric: false, isDate: false, isText: true },
  { name: 'cto_cod', type: 'varchar', description: 'Código de centro de actividad.', isNumeric: false, isDate: false, isText: true },
  { name: 'act_cod', type: 'varchar', description: 'Código de la actividad.', isNumeric: false, isDate: false, isText: true },
  { name: 'cmp_cod', type: 'smallint', description: 'Código de comprobante.', isNumeric: true, isDate: false, isText: false },
  { name: 'ven_cod', type: 'smallint', description: 'Código del agente vendedor.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_val', type: 'numeric', description: 'Valor del movimiento.', isNumeric: true, isDate: false, isText: false },
  { name: 'mnd_cla', type: 'varchar', description: 'Clase de moneda.', isNumeric: false, isDate: false, isText: true },
  { name: 'mnd_tas_act', type: 'numeric', description: 'Tasa de cambio actual.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_val_ext', type: 'numeric', description: 'Valor en moneda extranjera.', isNumeric: true, isDate: false, isText: false },
  { name: 'mnd_cla1', type: 'varchar', description: 'Clase de moneda secundaria.', isNumeric: false, isDate: false, isText: true },
  { name: 'mnd_tas_act1', type: 'numeric', description: 'Tasa de cambio secundaria.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_val_ext1', type: 'numeric', description: 'Valor divisa secundaria.', isNumeric: true, isDate: false, isText: false },
  { name: 'bco_cod', type: 'smallint', description: 'Código del banco.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_pla_che', type: 'varchar', description: 'Plaza del cheque.', isNumeric: false, isDate: false, isText: true },
  { name: 'mov_cheq', type: 'integer', description: 'Número de cheque.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_fec_che', type: 'date', description: 'Fecha del cheque.', isNumeric: false, isDate: true, isText: false },
  { name: 'mov_ben_che', type: 'varchar', description: 'Beneficiario del cheque.', isNumeric: false, isDate: false, isText: true },
  { name: 'suc_des', type: 'varchar', description: 'Agencia destino.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_cod', type: 'smallint', description: 'Código de anexo financiero.', isNumeric: true, isDate: false, isText: false },
  { name: 'clc_cod_rel', type: 'varchar', description: 'Clase de documento de relación.', isNumeric: false, isDate: false, isText: true },
  { name: 'doc_num_rel', type: 'numeric', description: 'Número de documento de relación.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_fec_rel', type: 'date', description: 'Fecha de documento de relación.', isNumeric: false, isDate: true, isText: false },
  { name: 'vcto_nro', type: 'smallint', description: 'Número de cuota a pagar.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_tip_cuo', type: 'varchar', description: 'Tipo de cuota.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_nro_pag', type: 'smallint', description: 'No. de cuotas pactadas.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_per_pag', type: 'smallint', description: 'Periodicidad de pago en días.', isNumeric: true, isDate: false, isText: false },
  { name: 'anx_cod', type: 'smallint', description: 'Código de anexo tributario.', isNumeric: true, isDate: false, isText: false },
  { name: 'cpt_cod', type: 'varchar', description: 'Código de concepto tributario.', isNumeric: false, isDate: false, isText: true },
  { name: 'ica_cod', type: 'integer', description: 'Actividad ICA.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_bas', type: 'numeric', description: 'Valor base.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_por_apl', type: 'numeric', description: '% aplicado.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_int_nom', type: 'numeric', description: 'Tasa de interés nominal.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_dia_bas', type: 'smallint', description: 'Número de días base.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_tip_int', type: 'varchar', description: 'Tipo de tasa de intereses.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_mod_int', type: 'varchar', description: 'Modalidad de intereses.', isNumeric: false, isDate: false, isText: true },
  { name: 'tas_cod', type: 'varchar', description: 'Indicador económico.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_ptos', type: 'numeric', description: 'Puntos.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_per_int', type: 'smallint', description: 'Periodicidad de interés en días.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_cap', type: 'numeric', description: 'Intereses capital.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_cap_ext', type: 'numeric', description: 'Intereses capital moneda extranjera.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_mor', type: 'numeric', description: 'Intereses mora.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_mor_ext', type: 'numeric', description: 'Intereses mora moneda extranjera.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_vcto1', type: 'date', description: 'Fecha primer vencimiento.', isNumeric: false, isDate: true, isText: false },
  { name: 'anf_vcto', type: 'date', description: 'Fecha de vencimiento.', isNumeric: false, isDate: true, isText: false },
  { name: 'dif_tip_amo', type: 'smallint', description: 'Tipo de amortización.', isNumeric: true, isDate: false, isText: false },
  { name: 'dif_fec_ini', type: 'date', description: 'Fecha inicio amortización.', isNumeric: false, isDate: true, isText: false },
  { name: 'dif_dia', type: 'smallint', description: 'Plazo amortización (días).', isNumeric: true, isDate: false, isText: false },
  { name: 'clc_cod_dif', type: 'varchar', description: 'Clase documento diferido.', isNumeric: false, isDate: false, isText: true },
  { name: 'doc_num_dif', type: 'numeric', description: 'Número documento diferido.', isNumeric: true, isDate: false, isText: false },
  { name: 'doc_fec_dif', type: 'date', description: 'Fecha diferido.', isNumeric: false, isDate: true, isText: false },
  { name: 'dif_con', type: 'integer', description: 'Consecutivo del diferido.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_est', type: 'smallint', description: 'Estado del movimiento.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_mnd_ext', type: 'boolean', description: '¿Moneda extranjera?', isNumeric: false, isDate: false, isText: false },
  { name: 'mov_exp_ext', type: 'boolean', description: '¿Excepción moneda extranjera?', isNumeric: false, isDate: false, isText: false },
  { name: 'mov_ret_igv', type: 'boolean', description: '¿Retención IGV?', isNumeric: false, isDate: false, isText: false },
  { name: 'pag_ele_num', type: 'numeric', description: 'Número de pago electrónico.', isNumeric: true, isDate: false, isText: false },
  { name: 'mov_bas_com', type: 'numeric', description: 'Valor base de compra.', isNumeric: true, isDate: false, isText: false },
  { name: 'suc_nom', type: 'varchar', description: 'Nombre agencia.', isNumeric: false, isDate: false, isText: true },
  { name: 'clc_nom', type: 'varchar', description: 'Nombre clase documento.', isNumeric: false, isDate: false, isText: true },
  { name: 'clc_ppt', type: 'boolean', description: '¿Clase de documento es de presupuesto?', isNumeric: false, isDate: false, isText: false },
  { name: 'cmp_nom', type: 'varchar', description: 'Nombre comprobante.', isNumeric: false, isDate: false, isText: true },
  { name: 'cta_nom', type: 'varchar', description: 'Nombre cuenta contable.', isNumeric: false, isDate: false, isText: true },
  { name: 'anx_nom', type: 'varchar', description: 'Nombre anexo tributario.', isNumeric: false, isDate: false, isText: true },
  { name: 'cpt_nom', type: 'varchar', description: 'Nombre concepto tributario.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_nom', type: 'varchar', description: 'Nombre anexo financiero.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_cla', type: 'smallint', description: 'Clase de anexo financiero: 0 sin anexo, 1 débito, 2 crédito.', isNumeric: true, isDate: false, isText: false },
  { name: 'anf_tip', type: 'varchar', description: 'Tipo anexo financiero.', isNumeric: false, isDate: false, isText: true },
  { name: 'anf_cre', type: 'smallint', description: 'Operación anexo financiero: 0 no aplica, 1 crea, 2 cruza.', isNumeric: true, isDate: false, isText: false },
  { name: 'ter_raz', type: 'varchar', description: 'Razón social tercero.', isNumeric: false, isDate: false, isText: true },
  { name: 'cto_nom', type: 'varchar', description: 'Nombre centro.', isNumeric: false, isDate: false, isText: true },
  { name: 'act_nom', type: 'varchar', description: 'Nombre actividad.', isNumeric: false, isDate: false, isText: true },
  { name: 'mnd_nom', type: 'varchar', description: 'Nombre moneda.', isNumeric: false, isDate: false, isText: true },
  { name: 'usr_nom', type: 'varchar', description: 'Nombre usuario.', isNumeric: false, isDate: false, isText: true },
  { name: 'est_nom', type: 'varchar', description: 'Nombre estado documento.', isNumeric: false, isDate: false, isText: true },
  { name: 'ven_nom', type: 'varchar', description: 'Nombre vendedor.', isNumeric: false, isDate: false, isText: true },
  { name: 'mnd_nom1', type: 'varchar', description: 'Nombre moneda secundaria.', isNumeric: false, isDate: false, isText: true },
  { name: 'bco_nom', type: 'varchar', description: 'Nombre banco.', isNumeric: false, isDate: false, isText: true },
  { name: 'suc_nom_des', type: 'varchar', description: 'Nombre agencia destino.', isNumeric: false, isDate: false, isText: true },
  { name: 'clc_nom_rel', type: 'varchar', description: 'Nombre clase documento relación.', isNumeric: false, isDate: false, isText: true },
  { name: 'ica_nom', type: 'varchar', description: 'Nombre ICA.', isNumeric: false, isDate: false, isText: true },
  { name: 'tas_nom', type: 'varchar', description: 'Nombre indicador económico.', isNumeric: false, isDate: false, isText: true },
  { name: 'tip_amo_nom', type: 'varchar', description: 'Nombre tipo amortización.', isNumeric: false, isDate: false, isText: true },
  { name: 'clc_nom_dif', type: 'varchar', description: 'Nombre clase documento diferido.', isNumeric: false, isDate: false, isText: true },
  { name: 'est_nom1', type: 'varchar', description: 'Nombre estado item movimiento.', isNumeric: false, isDate: false, isText: true },
  { name: 'ind_anf', type: 'smallint', description: '¿Maneja anexo financiero?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_anx', type: 'smallint', description: '¿Maneja anexo tributario?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_cto', type: 'smallint', description: '¿Maneja centro?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_mnd', type: 'smallint', description: '¿Maneja moneda extranjera?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_pre', type: 'smallint', description: '¿Cuenta presupuesto?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_nit', type: 'smallint', description: '¿Maneja NIT?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_bco', type: 'smallint', description: '¿Cuenta de banco?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_aju', type: 'smallint', description: '¿Cuenta de ajuste por inflación?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_dif', type: 'smallint', description: '¿Cuenta de diferido?', isNumeric: true, isDate: false, isText: false },
  { name: 'ind_caj', type: 'smallint', description: '¿Cuenta de caja?', isNumeric: true, isDate: false, isText: false }

];

const OPERATORS = {
  text: [
    { value: '=', label: 'Igual a' },
    { value: '!=', label: 'Diferente de' },
    { value: 'LIKE', label: 'Contiene' },
    { value: 'NOT LIKE', label: 'No contiene' },
    { value: 'IN', label: 'En lista' }
  ],
  number: [
    { value: '=', label: 'Igual a' },
    { value: '!=', label: 'Diferente de' },
    { value: '>', label: 'Mayor que' },
    { value: '>=', label: 'Mayor o igual que' },
    { value: '<', label: 'Menor que' },
    { value: '<=', label: 'Menor o igual que' },
    { value: 'BETWEEN', label: 'Entre' }
  ],
  date: [
    { value: '=', label: 'Igual a' },
    { value: '!=', label: 'Diferente de' },
    { value: '>', label: 'Posterior a' },
    { value: '>=', label: 'Posterior o igual a' },
    { value: '<', label: 'Anterior a' },
    { value: '<=', label: 'Anterior o igual a' },
    { value: 'BETWEEN', label: 'Entre fechas' }
  ]
};

class SchemaService {
  getTableColumns(): TableColumn[] {
    return CON_HIS_COLUMNS;
  }

  getOperatorsForColumn(columnName: string): Array<{value: string, label: string}> {
    const column = CON_HIS_COLUMNS.find(col => col.name === columnName);
    if (!column) return [];

    if (column.isNumeric) return OPERATORS.number;
    if (column.isDate) return OPERATORS.date;
    return OPERATORS.text;
  }

  generateSQL(config: QueryConfiguration): string {
    const { selectedFields, conditions, orderBy, groupBy, limit } = config;

    // SELECT clause
    let sql = `SELECT ${selectedFields.length > 0 ? selectedFields.join(', ') : '*'}\nFROM public.con_his`;

    // WHERE clause
    if (conditions.length > 0) {
      const whereConditions = conditions.map(condition => {
        const { field, operator, value, type } = condition;
        
        if (operator === 'LIKE' || operator === 'NOT LIKE') {
          return `${field} ${operator} '%${value}%'`;
        } else if (operator === 'IN') {
          const values = value.split(',').map(v => `'${v.trim()}'`).join(', ');
          return `${field} IN (${values})`;
        } else if (operator === 'BETWEEN') {
          const [val1, val2] = value.split(',');
          if (type === 'date') {
            return `${field} BETWEEN '${val1.trim()}' AND '${val2.trim()}'`;
          } else {
            return `${field} BETWEEN ${val1.trim()} AND ${val2.trim()}`;
          }
        } else {
          if (type === 'text' || type === 'date') {
            return `${field} ${operator} '${value}'`;
          } else {
            return `${field} ${operator} ${value}`;
          }
        }
      });
      
      sql += `\nWHERE ${whereConditions.join(' AND ')}`;
    }

    // GROUP BY clause
    if (groupBy.length > 0) {
      sql += `\nGROUP BY ${groupBy.join(', ')}`;
    }

    // ORDER BY clause
    if (orderBy.length > 0) {
      sql += `\nORDER BY ${orderBy.join(', ')}`;
    }

    // LIMIT clause
    if (limit && limit > 0) {
      sql += `\nLIMIT ${limit}`;
    }

    return sql;
  }

  getColumnType(columnName: string): 'text' | 'number' | 'date' {
    const column = CON_HIS_COLUMNS.find(col => col.name === columnName);
    if (!column) return 'text';
    
    if (column.isNumeric) return 'number';
    if (column.isDate) return 'date';
    return 'text';
  }
}

export const schemaService = new SchemaService();
