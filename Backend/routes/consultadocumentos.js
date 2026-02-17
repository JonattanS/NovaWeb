const express = require("express")
const router = express.Router()
const pool = require("../db")

// Función generadora de WHERE dinámico, según los filtros de la petición
function construirWhere(f) {
  const where = []
  const values = []
  let idx = 1

  if (f.suc_cod) {
    where.push(`suc_cod = $${idx++}`)
    values.push(f.suc_cod)
  }
  if (f.suc_cod_ini) {
    where.push(`suc_cod >= $${idx++}`)
    values.push(f.suc_cod_ini)
  }
  if (f.suc_cod_fin) {
    where.push(`suc_cod <= $${idx++}`)
    values.push(f.suc_cod_fin)
  }
  if (f.clc_cod) {
    where.push(`LOWER(clc_cod) LIKE LOWER($${idx++})`)
    values.push(`%${f.clc_cod}%`)
  }
  if (f.clc_cod_ini) {
    where.push(`clc_cod >= $${idx++}`)
    values.push(f.clc_cod_ini)
  }
  if (f.clc_cod_fin) {
    where.push(`clc_cod <= $${idx++}`)
    values.push(f.clc_cod_fin)
  }
  if (f.doc_num_ini) {
    where.push(`doc_num >= $${idx++}`)
    values.push(f.doc_num_ini)
  }
  if (f.doc_num_fin) {
    where.push(`doc_num <= $${idx++}`)
    values.push(f.doc_num_fin)
  }
  if (f.fecha_ini) {
    where.push(`doc_fec >= $${idx++}`)
    values.push(f.fecha_ini)
  }
  if (f.fecha_fin) {
    where.push(`doc_fec <= $${idx++}`)
    values.push(f.fecha_fin)
  }
  if (f.ter_nit_ini) {
    where.push(`ter_nit >= $${idx++}`)
    values.push(f.ter_nit_ini)
  }
  if (f.ter_nit_fin) {
    where.push(`ter_nit <= $${idx++}`)
    values.push(f.ter_nit_fin)
  }
  if (f.cta_cod_ini) {
    where.push(`cta_cod >= $${idx++}`)
    values.push(f.cta_cod_ini)
  }
  if (f.cta_cod_fin) {
    where.push(`cta_cod <= $${idx++}`)
    values.push(f.cta_cod_fin)
  }
  if (f.cmp_cod_ini) {
    where.push(`cmp_cod >= $${idx++}`)
    values.push(f.cmp_cod_ini)
  }
  if (f.cmp_cod_fin) {
    where.push(`cmp_cod <= $${idx++}`)
    values.push(f.cmp_cod_fin)
  }
  if (f.anx_cod_ini) {
    where.push(`anx_cod >= $${idx++}`)
    values.push(f.anx_cod_ini)
  }
  if (f.anx_cod_fin) {
    where.push(`anx_cod <= $${idx++}`)
    values.push(f.anx_cod_fin)
  }
  if (f.anf_cod) {
    where.push(`anf_cod = $${idx++}`)
    values.push(f.anf_cod)
  }
  if (f.anf_cod_ini) {
    where.push(`anf_cod >= $${idx++}`)
    values.push(f.anf_cod_ini)
  }
  if (f.anf_cod_fin) {
    where.push(`anf_cod <= $${idx++}`)
    values.push(f.anf_cod_fin)
  }
  if (f.doc_num_ref_ini) {
    where.push(`doc_num_ref >= $${idx++}`)
    values.push(f.doc_num_ref_ini)
  }
  if (f.doc_num_ref_fin) {
    where.push(`doc_num_ref <= $${idx++}`)
    values.push(f.doc_num_ref_fin)
  }
  if (f.doc_fec_ref_ini) {
    where.push(`doc_fec_ref >= $${idx++}`)
    values.push(f.doc_fec_ref_ini)
  }
  if (f.doc_fec_ref_fin) {
    where.push(`doc_fec_ref <= $${idx++}`)
    values.push(f.doc_fec_ref_fin)
  }
  if (f.doc_est_ini) {
    where.push(`doc_est >= $${idx++}`)
    values.push(f.doc_est_ini)
  }
  if (f.doc_est_fin) {
    where.push(`doc_est <= $${idx++}`)
    values.push(f.doc_est_fin)
  }
  if (f.cta_cod) {
    where.push(`cta_cod = $${idx++}`)
    values.push(f.cta_cod)
  }
  if (f.ter_nit) {
    where.push(`ter_nit = $${idx++}`)
    values.push(f.ter_nit)
  }
  if (f.doc_num_rel) {
    where.push(`doc_num_rel = $${idx++}`)
    values.push(f.doc_num_rel)
  }
  if (f.cor_ano) {
    where.push(`cor_ano = $${idx++}`)
    values.push(f.cor_ano)
  }
  if (f.cor_mes) {
    where.push(`cor_mes = $${idx++}`)
    values.push(f.cor_mes)
  }
  if (f.sal_tip) {
    where.push(`sal_tip = $${idx++}`)
    values.push(f.sal_tip)
  }

  // Puedes añadir aquí otros campos siguiendo la misma lógica.

  return {
    sql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
    values,
  }
}

// Función para construir WHERE dinámico para adm_log
function construirWhereAuditLog(f) {
  const where = []
  const values = []
  let idx = 1

  if (f.adm_ciaid) {
    where.push(`al.adm_ciaid = $${idx++}`)
    values.push(f.adm_ciaid)
  }
  if (f.logTip) {
    where.push(`al.logTip = $${idx++}`)
    values.push(f.logTip)
  }
  if (f.logPro) {
    where.push(`al.logPro = $${idx++}`)
    values.push(f.logPro)
  }
  if (f.adm_usrId) {
    where.push(`al.adm_usrId = $${idx++}`)
    values.push(f.adm_usrId)
  }
  if (f.fecha_ini) {
    where.push(`al.logFec >= $${idx++}::DATE`)
    values.push(f.fecha_ini)
  }
  if (f.fecha_fin) {
    where.push(`al.logFec <= $${idx++}::DATE + INTERVAL '1 day'`)
    values.push(f.fecha_fin)
  }

  return {
    sql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
    values,
  }
}

function validateFilters(filtros) {
  const errors = []

  // Validar campos enteros
  const integerFields = [
    "suc_cod",
    "doc_num_ini",
    "doc_num_fin",
    "ter_nit_ini",
    "ter_nit_fin",
    "cta_cod_ini",
    "cta_cod_fin",
    "cto_cod_ini",
    "cto_cod_fin",
    "act_cod_ini",
    "act_cod_fin",
  ]

  integerFields.forEach((field) => {
    if (filtros[field] && filtros[field].trim() !== "") {
      if (!/^\d+$/.test(filtros[field])) {
        errors.push(`El campo ${field} debe ser un número entero`)
      }
    }
  })

  // Validar clc_cod (solo letras)
  if (filtros.clc_cod && filtros.clc_cod.trim() !== "") {
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(filtros.clc_cod)) {
      errors.push("El campo clc_cod debe contener solo letras")
    }
  }

  // Validar fechas
  const dateFields = ["fecha_ini", "fecha_fin"]
  dateFields.forEach((field) => {
    if (filtros[field] && filtros[field].trim() !== "") {
      const date = new Date(filtros[field])
      if (isNaN(date.getTime())) {
        errors.push(`El campo ${field} debe ser una fecha válida`)
      }
    }
  })

  return errors
}

router.post("/consultadocumentos", async (req, res) => {
  const { fuente = "con_his", ...filtros } = req.body

  console.log('=== CONSULTA DOCUMENTOS ===')
  console.log('Fuente:', fuente)
  console.log('Filtros recibidos:', JSON.stringify(filtros, null, 2))

  const validationErrors = validateFilters(filtros)
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: "Errores de validación",
      detalles: validationErrors,
    })
  }

  const { sql, values } = construirWhere(filtros)
  console.log('WHERE generado:', sql)
  console.log('Valores para query:', values)



  let baseQuery

  switch (fuente) {
    case "con_his":
    default:
      const whereConHis = sql ? `${sql} AND clc_cod != 'SI'` : "WHERE clc_cod != 'SI'"
      baseQuery = `
        SELECT id, adm_ciaid, suc_cod, clc_cod, doc_num, doc_fec, doc_tot_deb, doc_tot_crd, doc_pre, doc_num_ref, doc_fec_ref,
          clc_ord, doc_com_ven, ter_res, doc_ide, doc_obs, cor_ano, cor_mes, cor_dia, doc_ori, usr_cod, usr_fec, usr_hor, doc_est,
          mov_cons, cta_cod, mov_det, ter_nit, cto_cod, act_cod, cmp_cod, ven_cod, mov_val, mnd_cla, mnd_tas_act, mov_val_ext, mnd_cla1,
          mnd_tas_act1, mov_val_ext1, bco_cod, mov_pla_che, mov_cheq, mov_fec_che, mov_ben_che, suc_des, anf_cod, clc_cod_rel, doc_num_rel,
          doc_fec_rel, vcto_nro, anf_tip_cuo, anf_nro_pag, anf_per_pag, anx_cod, cpt_cod, ica_cod, mov_bas, mov_por_apl, anf_int_nom, 
          mov_dia_bas, anf_tip_int, anf_mod_int, tas_cod, anf_ptos, anf_per_int, mov_cap, mov_cap_ext, mov_mor, mov_mor_ext, anf_vcto1, 
          anf_vcto, dif_tip_amo, dif_fec_ini, dif_dia, clc_cod_dif, doc_num_dif, doc_fec_dif, dif_con, mov_est, mov_mnd_ext, mov_exp_ext, 
          mov_ret_igv, pag_ele_num, mov_bas_com, mov_cheq as che_num, suc_nom, clc_nom, clc_ppt, cmp_nom, cta_nom, anx_nom, cpt_nom, anf_nom, anf_cla, anf_tip,
          anf_cre, ter_raz, cto_nom, act_nom, mnd_nom, usr_nom, est_nom, ven_nom, mnd_nom1, bco_nom, suc_nom_des, clc_nom_rel, ica_nom, tas_nom, 
          tip_amo_nom, clc_nom_dif, est_nom1, ind_anf, ind_anx, ind_cto, ind_mnd, ind_pre, ind_nit, ind_bco, ind_aju, ind_dif, ind_caj
        FROM con_his
        ${whereConHis}
        ORDER BY cta_cod, doc_fec, mov_cons
      `
      break

    case "con_sal":
      baseQuery = `
        SELECT id, adm_ciaid, cor_ano, cor_mes, cor_dia, sal_tip, cta_cod, suc_cod, ter_nit, cto_cod, 
          act_cod, anx_cod, cpt_cod, anf_cod, clc_cod, doc_num, doc_fec, num_itm, sal_atr, sal_can, sal_ini, sal_deb, 
          sal_crd, sal_can_mes, sal_ini_ext, sal_deb_ext, sal_crd_ext, suc_nom, clc_nom, cta_nom, anx_nom, cpt_nom, 
          anf_nom, ter_raz, cto_nom, act_nom
        FROM  con_sal
        ${sql}
        ORDER BY id
      `
      break

     case "acu_sal":
      // Limpiar y reconstruir values para acu_sal
      const acuSalValues = []
      const whereSalConditions = []
      const whereHisConditions = []
      let paramIdx = 1
      
      if (filtros.suc_cod) {
        whereSalConditions.push(`suc_cod = $${paramIdx}`)
        whereHisConditions.push(`suc_cod = $${paramIdx}`)
        acuSalValues.push(filtros.suc_cod)
        paramIdx++
      }
      if (filtros.cta_cod) {
        whereSalConditions.push(`cta_cod = $${paramIdx}`)
        whereHisConditions.push(`cta_cod = $${paramIdx}`)
        acuSalValues.push(filtros.cta_cod)
        paramIdx++
      }
      if (filtros.cor_ano) {
        whereSalConditions.push(`cor_ano = $${paramIdx}`)
        whereHisConditions.push(`cor_ano = $${paramIdx}`)
        acuSalValues.push(filtros.cor_ano)
        paramIdx++
      }
      whereSalConditions.push('sal_ini != 0')
      
      if (filtros.cor_mes) {
        whereHisConditions.push(`cor_mes <= $${paramIdx}`)
        acuSalValues.push(filtros.cor_mes)
        paramIdx++
      }
      whereHisConditions.push("clc_cod != 'SI'")
      
      const whereSalStr = whereSalConditions.length > 0 ? `WHERE ${whereSalConditions.join(' AND ')}` : ''
      const whereHisStr = whereHisConditions.length > 0 ? `WHERE ${whereHisConditions.join(' AND ')}` : "WHERE clc_cod != 'SI'"
      
      baseQuery = `
        SELECT 
          COALESCE((
            SELECT sal_ini
            FROM con_sal 
            ${whereSalStr}
            ORDER BY id DESC
            LIMIT 1
          ), 0) + COALESCE((
            SELECT SUM(mov_val) 
            FROM con_his 
            ${whereHisStr}
          ), 0) as valor
      `
      
      // Reemplazar values con los valores específicos de acu_sal
      values.length = 0
      values.push(...acuSalValues)
      break 

    case "anf_con":
      const whereAnf = sql ? `${sql} AND anf_cre = 1` : 'WHERE anf_cre = 1'
      baseQuery = `
        SELECT id, adm_ciaid, suc_cod, clc_cod, doc_num, doc_fec, doc_tot_deb, doc_tot_crd, doc_pre, doc_num_ref, doc_fec_ref,
          clc_ord, doc_com_ven, ter_res, doc_ide, doc_obs, cor_ano, cor_mes, cor_dia, doc_ori, usr_cod, usr_fec, usr_hor, doc_est,
          mov_cons, cta_cod, mov_det, ter_nit, cto_cod, act_cod, cmp_cod, ven_cod, mov_val, mnd_cla, mnd_tas_act, mov_val_ext, mnd_cla1,
          mnd_tas_act1, mov_val_ext1, bco_cod, mov_pla_che, mov_cheq, mov_fec_che, mov_ben_che, suc_des, anf_cod, clc_cod_rel, doc_num_rel,
          doc_fec_rel, vcto_nro, anf_tip_cuo, anf_nro_pag, anf_per_pag, anx_cod, cpt_cod, ica_cod, mov_bas, mov_por_apl, anf_int_nom, 
          mov_dia_bas, anf_tip_int, anf_mod_int, tas_cod, anf_ptos, anf_per_int, mov_cap, mov_cap_ext, mov_mor, mov_mor_ext, anf_vcto1, 
          anf_vcto, dif_tip_amo, dif_fec_ini, dif_dia, clc_cod_dif, doc_num_dif, doc_fec_dif, dif_con, mov_est, mov_mnd_ext, mov_exp_ext, 
          mov_ret_igv, pag_ele_num, mov_bas_com, mov_cheq as che_num, suc_nom, clc_nom, clc_ppt, cmp_nom, cta_nom, anx_nom, cpt_nom, anf_nom, anf_cla, anf_tip,
          anf_cre, ter_raz, cto_nom, act_nom, mnd_nom, usr_nom, est_nom, ven_nom, mnd_nom1, bco_nom, suc_nom_des, clc_nom_rel, ica_nom, tas_nom, 
          tip_amo_nom, clc_nom_dif, est_nom1, ind_anf, ind_anx, ind_cto, ind_mnd, ind_pre, ind_nit, ind_bco, ind_aju, ind_dif, ind_caj
        FROM con_his
        ${whereAnf}
        ORDER BY id
      `
      break  

      case "anf_con2":
      const whereAnf1 = sql ? `${sql} AND anf_cre = 2` : 'WHERE anf_cre = 2'
      baseQuery = `
        SELECT id, adm_ciaid, suc_cod, clc_cod, doc_num, doc_fec, doc_tot_deb, doc_tot_crd, doc_pre, doc_num_ref, doc_fec_ref,
          clc_ord, doc_com_ven, ter_res, doc_ide, doc_obs, cor_ano, cor_mes, cor_dia, doc_ori, usr_cod, usr_fec, usr_hor, doc_est,
          mov_cons, cta_cod, mov_det, ter_nit, cto_cod, act_cod, cmp_cod, ven_cod, mov_val, mnd_cla, mnd_tas_act, mov_val_ext, mnd_cla1,
          mnd_tas_act1, mov_val_ext1, bco_cod, mov_pla_che, mov_cheq, mov_fec_che, mov_ben_che, suc_des, anf_cod, clc_cod_rel, doc_num_rel,
          doc_fec_rel, vcto_nro, anf_tip_cuo, anf_nro_pag, anf_per_pag, anx_cod, cpt_cod, ica_cod, mov_bas, mov_por_apl, anf_int_nom, 
          mov_dia_bas, anf_tip_int, anf_mod_int, tas_cod, anf_ptos, anf_per_int, mov_cap, mov_cap_ext, mov_mor, mov_mor_ext, anf_vcto1, 
          anf_vcto, dif_tip_amo, dif_fec_ini, dif_dia, clc_cod_dif, doc_num_dif, doc_fec_dif, dif_con, mov_est, mov_mnd_ext, mov_exp_ext, 
          mov_ret_igv, pag_ele_num, mov_bas_com, mov_cheq as che_num, suc_nom, clc_nom, clc_ppt, cmp_nom, cta_nom, anx_nom, cpt_nom, anf_nom, anf_cla, anf_tip,
          anf_cre, ter_raz, cto_nom, act_nom, mnd_nom, usr_nom, est_nom, ven_nom, mnd_nom1, bco_nom, suc_nom_des, clc_nom_rel, ica_nom, tas_nom, 
          tip_amo_nom, clc_nom_dif, est_nom1, ind_anf, ind_anx, ind_cto, ind_mnd, ind_pre, ind_nit, ind_bco, ind_aju, ind_dif, ind_caj
        FROM con_his
        ${whereAnf1}
        ORDER BY id
      `
      break  

    case "con_anf_mov3":
      baseQuery = `
        SELECT 
          ter_nit,
          ter_raz,
          anf_cod,
          doc_num,
          SUM(CASE WHEN doc_fec < $${values.length + 1} THEN mov_val ELSE 0 END) as valor_inicial,
          SUM(CASE WHEN doc_fec >= $${values.length + 1} AND mov_val > 0 THEN mov_val ELSE 0 END) as debitos,
          SUM(CASE WHEN doc_fec >= $${values.length + 1} AND mov_val < 0 THEN ABS(mov_val) ELSE 0 END) as creditos,
          SUM(mov_val) as saldo
        FROM con_his
        ${sql}
        GROUP BY ter_nit, ter_raz, anf_cod, doc_num
        ORDER BY ter_nit, anf_cod
      `
      // Agregar fecha_corte a los valores si existe
      if (filtros.fecha_corte) {
        values.push(filtros.fecha_corte)
      } else {
        values.push(new Date().toISOString().split('T')[0]) // Fecha actual por defecto
      }
      break  


    case "con_vctos_edades":
      const whereVctos = []
      const vctoValues = []
      let vctoIdx = 1

      whereVctos.push(`ch.cor_ano = EXTRACT(YEAR FROM CURRENT_DATE)`)
      whereVctos.push(`ch.anf_cre = 1`)
      whereVctos.push(`ch.anf_vcto IS NOT NULL`)
      
      if (filtros.suc_cod) {
        whereVctos.push(`ch.suc_cod LIKE $${vctoIdx++} || '%'`)
        vctoValues.push(filtros.suc_cod)
      }
      if (filtros.cta_cod) {
        whereVctos.push(`ch.cta_cod LIKE $${vctoIdx++} || '%'`)
        vctoValues.push(filtros.cta_cod)
      }
      if (filtros.anf_cod) {
        whereVctos.push(`ch.anf_cod = $${vctoIdx++}`)
        vctoValues.push(filtros.anf_cod)
      }
      if (filtros.ter_nit_ini) {
        whereVctos.push(`ch.ter_nit >= $${vctoIdx++}`)
        vctoValues.push(filtros.ter_nit_ini)
      }
      if (filtros.ter_nit_fin) {
        whereVctos.push(`ch.ter_nit <= $${vctoIdx++}`)
        vctoValues.push(filtros.ter_nit_fin)
      }
      whereVctos.push(`ch.doc_est <> 9`)

      const orderBy = filtros.tipoOrden === 'alfabetico' 
        ? 'ch.ter_raz, ch.anf_vcto, ch.doc_num' 
        : 'ch.ter_nit, ch.anf_vcto, ch.doc_num'

      baseQuery = `
        SELECT 
          ch.clc_cod,
          ch.doc_num::text,
          ch.doc_fec::text,
          ch.anf_vcto::text as vcto_fec,
          ch.ter_nit,
          ch.ter_raz,
          CASE 
            WHEN ch.anf_vcto >= CURRENT_DATE THEN ch.mov_val 
            ELSE 0 
          END as sin_vencer,
          CASE 
            WHEN ch.anf_vcto < CURRENT_DATE AND ch.anf_vcto >= CURRENT_DATE - INTERVAL '30 days' 
            THEN ch.mov_val ELSE 0 
          END as dias_1_30,
          CASE 
            WHEN ch.anf_vcto < CURRENT_DATE - INTERVAL '30 days' AND ch.anf_vcto >= CURRENT_DATE - INTERVAL '60 days' 
            THEN ch.mov_val ELSE 0 
          END as dias_31_60,
          CASE 
            WHEN ch.anf_vcto < CURRENT_DATE - INTERVAL '60 days' AND ch.anf_vcto >= CURRENT_DATE - INTERVAL '90 days' 
            THEN ch.mov_val ELSE 0 
          END as dias_61_90,
          CASE 
            WHEN ch.anf_vcto < CURRENT_DATE - INTERVAL '90 days' 
            THEN ch.mov_val ELSE 0 
          END as mas_90_dias,
          ch.mov_val as total,
          CASE 
            WHEN ch.anf_vcto < CURRENT_DATE 
            THEN CURRENT_DATE - ch.anf_vcto 
            ELSE 0 
          END as dias_vencido
        FROM con_his ch
        WHERE ${whereVctos.join(' AND ')}
        ORDER BY ${orderBy}
      `
      
      values.length = 0
      values.push(...vctoValues)
      break

    case "adm_log":
      const { sql: sqlAudit, values: valuesAudit } = construirWhereAuditLog(filtros)
      baseQuery = `
        SELECT 
          al.id,
          al.adm_ciaid,
          al.logTip,
          al.logPro,
          al.logGru,
          al.logSec,
          al.adm_menId,
          al.logOpe,
          al.logDet,
          al.adm_usrId,
          al.logFec,
          COALESCE(au.usrcod, 'N/A') as usuario,
          COALESCE(au.usrnom, 'N/A') as usuario_nombre,
          COALESCE(ac.ciaraz, 'N/A') as empresa
        FROM adm_log al
        LEFT JOIN adm_usr au ON al.adm_usrId = au.id
        LEFT JOIN adm_cia ac ON al.adm_ciaid = ac.id
        ${sqlAudit}
        ORDER BY al.logFec DESC
      `
      try {
        const result = await pool.query(baseQuery, valuesAudit)
        return res.json(result.rows)
      } catch (err) {
        console.error('[AUDIT LOGS ERROR]', err)
        return res.status(500).json({ error: `Error consultando ${fuente}`, detalle: err.message })
      }


    // Agregar más casos según necesidad
  }


  try {
    console.log('Query final a ejecutar:')
    console.log(baseQuery)
    console.log('Con valores:', values)
    console.log('========================\n')
    
    const result = await pool.query(baseQuery, values)
    res.json(result.rows)
  } catch (err) {
    console.error(`[CONSULTA ERROR - ${fuente}]`, err)
    res.status(500).json({ error: `Error consultando ${fuente}`, detalle: err.message })
  }
})

module.exports = router
