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

  // Puedes añadir aquí otros campos siguiendo la misma lógica.

  return {
    sql: where.length > 0 ? `WHERE ${where.join(" AND ")}` : "",
    values,
  }
}

router.post("/consultadocumentos", async (req, res) => {
  const { fuente = "con_his", ...filtros } = req.body

  const { sql, values } = construirWhere(filtros)

  let baseQuery

  switch (fuente) {
    case "con_his":
    default:
      baseQuery = `
        SELECT id, adm_ciaid, suc_cod, clc_cod, doc_num, doc_fec, doc_tot_deb, doc_tot_crd, doc_pre, doc_num_ref, doc_fec_ref,
          clc_ord, doc_com_ven, ter_res, doc_ide, doc_obs, cor_ano, cor_mes, cor_dia, doc_ori, usr_cod, usr_fec, usr_hor, doc_est,
          mov_cons, cta_cod, mov_det, ter_nit, cto_cod, act_cod, cmp_cod, ven_cod, mov_val, mnd_cla, mnd_tas_act, mov_val_ext, mnd_cla1,
          mnd_tas_act1, mov_val_ext1, bco_cod, mov_pla_che, mov_cheq, mov_fec_che, mov_ben_che, suc_des, anf_cod, clc_cod_rel, doc_num_rel,
          doc_fec_rel, vcto_nro, anf_tip_cuo, anf_nro_pag, anf_per_pag, anx_cod, cpt_cod, ica_cod, mov_bas, mov_por_apl, anf_int_nom, 
          mov_dia_bas, anf_tip_int, anf_mod_int, tas_cod, anf_ptos, anf_per_int, mov_cap, mov_cap_ext, mov_mor, mov_mor_ext, anf_vcto1, 
          anf_vcto, dif_tip_amo, dif_fec_ini, dif_dia, clc_cod_dif, doc_num_dif, doc_fec_dif, dif_con, mov_est, mov_mnd_ext, mov_exp_ext, 
          mov_ret_igv, pag_ele_num, mov_bas_com, suc_nom, clc_nom, clc_ppt, cmp_nom, cta_nom, anx_nom, cpt_nom, anf_nom, anf_cla, anf_tip,
          anf_cre, ter_raz, cto_nom, act_nom, mnd_nom, usr_nom, est_nom, ven_nom, mnd_nom1, bco_nom, suc_nom_des, clc_nom_rel, ica_nom, tas_nom, 
          tip_amo_nom, clc_nom_dif, est_nom1, ind_anf, ind_anx, ind_cto, ind_mnd, ind_pre, ind_nit, ind_bco, ind_aju, ind_dif, ind_caj
        FROM con_his
        ${sql}
        ORDER BY LOWER(clc_cod), doc_num, doc_fec, mov_cons
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

    // Agregar más casos según necesidad
  }

  try {
    const result = await pool.query(baseQuery, values)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: `Error consultando ${fuente}`, detalle: err.message })
  }
})

module.exports = router;
