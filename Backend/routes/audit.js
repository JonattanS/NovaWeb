const pool = require('../db');

/**
 * Registra un evento de auditoría en la tabla adm_log
 * 
 * @param {Object} auditData - Datos de auditoría
 * @param {number} auditData.adm_ciaId - ID de la empresa
 * @param {string} auditData.logTip - Tipo de log (LOGIN_EXITOSO, LOGIN_FALLIDO, etc)
 * @param {string} auditData.logPro - Proceso (LOGIN, QUERY, etc)
 * @param {number} auditData.logGru - Grupo de operación (0 para root, otro número para grupo)
 * @param {number} auditData.logSec - Sección (0 para global)
 * @param {number} auditData.adm_menId - ID del módulo (puede ser 0)
 * @param {string} auditData.logOpe - Operación (CREATE, READ, UPDATE, DELETE, LOGIN)
 * @param {string} auditData.logDet - Detalles adicionales (JSON string o texto)
 * @param {number} auditData.adm_usrId - ID del usuario (puede ser null si falla el login)
 * @returns {Promise<boolean>} true si se registró correctamente
 */
async function createAuditLog(auditData) {
  try {
    const {
      adm_ciaId,
      logTip,
      logPro = 'LOGIN',
      logGru = 0,
      logSec = 0,
      adm_menId = 0,
      logOpe = 'LOGIN',
      logDet = null,
      adm_usrId = null,
    } = auditData;

    // Validación básica
    if (!adm_ciaId || !logTip) {
      console.error('Faltan datos requeridos para crear log de auditoría');
      return false;
    }

    // Insertar en la tabla adm_log
    const query = `
      INSERT INTO adm_log (
        adm_ciaId,
        logTip,
        logPro,
        logGru,
        logSec,
        adm_menId,
        logOpe,
        logDet,
        adm_usrId,
        logFec
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;

    const result = await pool.query(query, [
      adm_ciaId,
      logTip,
      logPro,
      logGru,
      logSec,
      adm_menId,
      logOpe,
      logDet,
      adm_usrId,
    ]);

    if (result.rows.length > 0) {
      console.log(`[AUDIT] Log creado con ID: ${result.rows[0].id}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('[AUDIT ERROR]', error.message);
    // No lanzar excepción, solo registrar el error
    // para no interrumpir el flujo de login
    return false;
  }
}

/**
 * Registra un intento de login exitoso
 */
async function logLoginSuccess(adm_ciaId, adm_usrId, usrcod, usrnom) {
  return createAuditLog({
    adm_ciaId,
    logTip: 'LOGIN_EXITOSO',
    logPro: 'LOGIN',
    logGru: 0,
    logSec: 0,
    adm_menId: 0,
    logOpe: 'LOGIN',
    logDet: JSON.stringify({
      usuario: usrcod,
      nombre: usrnom,
      timestamp: new Date().toISOString(),
      tipo: 'Login exitoso',
    }),
    adm_usrId,
  });
}

/**
 * Registra un intento de login fallido
 */
async function logLoginFailure(adm_ciaId, usrcod, razon) {
  return createAuditLog({
    adm_ciaId,
    logTip: 'LOGIN_FALLIDO',
    logPro: 'LOGIN',
    logGru: 0,
    logSec: 0,
    adm_menId: 0,
    logOpe: 'LOGIN',
    logDet: JSON.stringify({
      usuario: usrcod,
      razon,
      timestamp: new Date().toISOString(),
      tipo: 'Login fallido',
    }),
    adm_usrId: null, // No hay usuario autenticado en login fallido
  });
}

module.exports = {
  createAuditLog,
  logLoginSuccess,
  logLoginFailure,
};
