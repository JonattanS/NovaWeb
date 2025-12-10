const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const { logLoginSuccess, logLoginFailure, logLogout } = require('./audit');

const JWT_SECRET = 'clave_secreta_super_segura';
const REFRESH_TOKEN_SECRET = 'clave_refresh_super_segura';

// Duración del access token: 30 minutos
const ACCESS_TOKEN_DURATION = '30m';
// Duración del refresh token: 7 días
const REFRESH_TOKEN_DURATION = '7d';

router.post('/login', async (req, res) => {
  const { usrcod, usrpsw } = req.body;

  // Validación básica
  if (!usrcod || !usrpsw) {
    return res.status(400).json({ success: false, message: "Usuario y contraseña requeridos" });
  }

  try {
    // Consulta al usuario
    const { rows } = await pool.query('SELECT * FROM adm_usr WHERE usrcod = $1', [usrcod]);
    
    if (rows.length === 0) {
      // Usuario no existe - registrar intento fallido
      console.warn(`[LOGIN] Intento con usuario no existente: ${usrcod}`);
      
      await logLoginFailure(1, usrcod, 'Usuario no existe');
      
      return res.status(200).json({ success: false, message: "Usuario no existe" });
    }

    const user = rows[0];

    if (user.usrpsw !== usrpsw) {
      // Contraseña incorrecta - registrar intento fallido
      console.warn(`[LOGIN] Contraseña incorrecta para usuario: ${usrcod}`);
      
      await logLoginFailure(user.adm_ciaid, usrcod, 'Contraseña incorrecta');
      
      return res.status(200).json({ success: false, message: "Contraseña incorrecta" });
    }

    // Consulta la razón social de la cia
    const { rows: ciaRows } = await pool.query('SELECT ciaraz FROM adm_cia WHERE id = $1', [user.adm_ciaid]);
    const ciaraz = ciaRows.length > 0 ? ciaRows[0].ciaraz : null;

    // CRÍTICO: Obtener los portafolios ASIGNADOS a ESTE USUARIO específicamente
    const { rows: portafolioRows } = await pool.query(
      'SELECT porcod FROM adm_usr_por WHERE adm_usrid = $1',
      [user.id]
    );
    const portafolios = portafolioRows.map(row => row.porcod);

    // Consulta el rol del usuario
    const rolResult = await pool.query('SELECT rolcod, roldes FROM adm_rol WHERE id = $1', [user.adm_rolid]);
    const rol = rolResult.rows[0] || { rolcod: null, roldes: null };

    // Payload del token
    const tokenPayload = {
      id: user.id,
      adm_ciaid: user.adm_ciaid,
      usrcod: user.usrcod,
      usrnom: user.usrnom,
      ciaraz,
      adm_rolid: user.adm_rolid,
      rolcod: rol.rolcod,
      roldes: rol.roldes,
      portafolios,
    };

    // Generar access token (30 minutos)
    const accessToken = jwt.sign(
      tokenPayload,
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_DURATION }
    );

    // Generar refresh token (7 días)
    const refreshToken = jwt.sign(
      { id: user.id, usrcod: user.usrcod },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_DURATION }
    );

    // Login exitoso - registrar en auditoría
    console.log(`[LOGIN SUCCESS] Usuario: ${usrcod} (${user.id})`);
    await logLoginSuccess(user.adm_ciaid, user.id, usrcod, user.usrnom);

    // Devolver datos del usuario, access token y refresh token
    return res.status(200).json({
      success: true,
      accessToken,      // Token de 30 minutos
      refreshToken,     // Token de 7 días
      expiresIn: 1800,  // 30 minutos en segundos
      user: {
        token: accessToken, // Para compatibilidad
        id: user.id,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        adm_ciaid: user.adm_ciaid,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes,
        portafolios,
      }
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

/**
 * POST /api/refresh-token
 * Obtiene un nuevo access token usando el refresh token
 */
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: "Refresh token requerido" });
  }

  try {
    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    // Obtener datos actualizados del usuario
    const { rows } = await pool.query('SELECT * FROM adm_usr WHERE id = $1', [decoded.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Consulta la razón social de la cia
    const { rows: ciaRows } = await pool.query('SELECT ciaraz FROM adm_cia WHERE id = $1', [user.adm_ciaid]);
    const ciaraz = ciaRows.length > 0 ? ciaRows[0].ciaraz : null;

    // CRÍTICO: Obtener los portafolios ASIGNADOS a ESTE USUARIO específicamente
    const { rows: portafolioRows } = await pool.query(
      'SELECT porcod FROM adm_usr_por WHERE adm_usrid = $1',
      [user.id]
    );
    const portafolios = portafolioRows.map(row => row.porcod);

    // Consulta el rol
    const rolResult = await pool.query('SELECT rolcod, roldes FROM adm_rol WHERE id = $1', [user.adm_rolid]);
    const rol = rolResult.rows[0] || { rolcod: null, roldes: null };

    // Generar nuevo access token con toda la información de autorización
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        adm_ciaid: user.adm_ciaid,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes,
        portafolios,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_DURATION }
    );

    console.log(`[TOKEN REFRESH] Usuario: ${user.usrcod} (${user.id})`);

    // Devolver el nuevo token PLUS los datos de usuario actualizados
    // para que el frontend pueda refrescar el contexto completo
    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: 1800, // 30 minutos en segundos
      user: {
        token: newAccessToken,
        id: user.id,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        adm_ciaid: user.adm_ciaid,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes,
        portafolios,
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: "Refresh token expirado" });
    }
    console.error('[REFRESH TOKEN ERROR]', error);
    return res.status(401).json({ success: false, message: "Token inválido" });
  }
});

/**
 * POST /api/logout
 * Registra el logout del usuario en auditoría
 */
router.post('/logout', async (req, res) => {
  const { usrId, adm_ciaid } = req.body;

  try {
    // Registrar logout en auditoría
    if (usrId && adm_ciaid) {
      await logLogout(adm_ciaid, usrId);
      console.log(`[LOGOUT] Usuario ID: ${usrId}`);
    }

    return res.status(200).json({ success: true, message: "Logout registrado" });
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    // No fallar el logout aunque falle la auditoría
    return res.status(200).json({ success: true, message: "Logout completado" });
  }
});

module.exports = router;
