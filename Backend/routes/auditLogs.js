const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * GET /api/audit-logs
 * Obtiene logs de auditoría con filtros opcionales
 * 
 * Query parameters:
 * - logTip: Filtrar por tipo de log (LOGIN_EXITOSO, LOGIN_FALLIDO, etc)
 * - logPro: Filtrar por proceso (LOGIN, QUERY, etc)
 * - adm_usrId: Filtrar por usuario
 * - adm_ciaid: Filtrar por compañía
 * - startDate: Fecha inicio (YYYY-MM-DD)
 * - endDate: Fecha fin (YYYY-MM-DD)
 * - page: Número de página (default: 1)
 * - limit: Registros por página (default: 20, max: 100)
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const {
      logTip,
      logPro,
      adm_usrId,
      adm_ciaid,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Validar límite
    let pageNum = parseInt(page) || 1;
    let limitNum = parseInt(limit) || 20;
    if (limitNum > 100) limitNum = 100;
    if (pageNum < 1) pageNum = 1;

    const offset = (pageNum - 1) * limitNum;

    // Construir query dinámicamente
    let where = [];
    let params = [];
    let paramCount = 1;

    if (logTip) {
      where.push(`logTip = $${paramCount}`);
      params.push(logTip);
      paramCount++;
    }

    if (logPro) {
      where.push(`logPro = $${paramCount}`);
      params.push(logPro);
      paramCount++;
    }

    if (adm_usrId) {
      where.push(`adm_usrId = $${paramCount}`);
      params.push(parseInt(adm_usrId));
      paramCount++;
    }

    if (adm_ciaid) {
      where.push(`adm_ciaid = $${paramCount}`);
      params.push(parseInt(adm_ciaid));
      paramCount++;
    }

    if (startDate) {
      where.push(`logFec >= $${paramCount}::DATE`);
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      where.push(`logFec <= $${paramCount}::DATE + INTERVAL '1 day'`);
      params.push(endDate);
      paramCount++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM adm_log ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total) || 0;
    const pages = Math.ceil(total / limitNum);

    // Obtener logs
    const query = `
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
      ${whereClause}
      ORDER BY al.logFec DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    params.push(limitNum);
    params.push(offset);

    const result = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error('[AUDIT LOGS ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría',
      error: error.message,
    });
  }
});

/**
 * GET /api/audit-logs/summary
 * Obtiene un resumen de logs (por tipo, por usuario, etc)
 */
router.get('/audit-logs/summary', async (req, res) => {
  try {
    const { adm_ciaid, days = 7 } = req.query;

    let whereClause = `WHERE logFec >= NOW() - INTERVAL '${parseInt(days)} days'`;
    let params = [];

    if (adm_ciaid) {
      whereClause += ` AND adm_ciaid = $1`;
      params.push(parseInt(adm_ciaid));
    }

    // Resumen por tipo de log
    const byType = await pool.query(`
      SELECT logTip, COUNT(*) as cantidad
      FROM adm_log
      ${whereClause}
      GROUP BY logTip
      ORDER BY cantidad DESC
    `, params);

    // Resumen por usuario
    const byUser = await pool.query(`
      SELECT 
        au.id,
        au.usrcod,
        au.usrnom,
        COUNT(*) as cantidad
      FROM adm_log al
      LEFT JOIN adm_usr au ON al.adm_usrId = au.id
      ${whereClause}
      GROUP BY au.id, au.usrcod, au.usrnom
      ORDER BY cantidad DESC
      LIMIT 10
    `, params);

    // Resumen por proceso
    const byProcess = await pool.query(`
      SELECT logPro, COUNT(*) as cantidad
      FROM adm_log
      ${whereClause}
      GROUP BY logPro
      ORDER BY cantidad DESC
    `, params);

    return res.status(200).json({
      success: true,
      data: {
        byType: byType.rows,
        byUser: byUser.rows,
        byProcess: byProcess.rows,
      },
      period: `Últimos ${days} días`,
    });
  } catch (error) {
    console.error('[AUDIT SUMMARY ERROR]', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener resumen de auditoría',
      error: error.message,
    });
  }
});

module.exports = router;
