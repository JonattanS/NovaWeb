const express = require('express');
const router = express.Router();
const pool = require('../db'); // pool global con conexión a PostgreSQL
const jwt = require('jsonwebtoken');
const { logLoginSuccess, logLoginFailure } = require('./audit');
const axios = require('axios');

const JWT_SECRET = 'clave_secreta_super_segura';

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

      // Intentamos registrar con una cia por defecto (ID 1, ajusta según tu BD)
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

    // Consulta los portafolios habilitados para esta cia
    const { rows: portafolioRows } = await pool.query('SELECT porcod FROM nov_por WHERE adm_ciaid = $1', [user.adm_ciaid]);
    const portafolios = portafolioRows.map(row => row.porcod);

    // Consulta el rol del usuario
    const rolResult = await pool.query('SELECT rolcod, roldes FROM adm_rol WHERE id = $1', [user.adm_rolid]);
    const rol = rolResult.rows[0] || { rolcod: null, roldes: null };

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        adm_usrid: user.id,
        adm_ciaid: user.adm_ciaid,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Login exitoso - registrar en auditoría
    console.log(`[LOGIN SUCCESS] Usuario: ${usrcod} (${user.id})`);
    await logLoginSuccess(user.adm_ciaid, user.id, usrcod, user.usrnom);

    // Llamar al microservicio de menú
    let menuData = null;
    try {
      console.log('[MENU SERVICE] Intentando conectar a: http://10.11.11.246:8888/menu');
      const menuResponse = await axios.get('http://10.11.11.246:8888/menu', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });
      menuData = menuResponse.data;
      console.log('[MENU SERVICE] Respuesta exitosa:', menuData);
    } catch (menuError) {
      console.error('[MENU SERVICE ERROR]', {
        message: menuError.message,
        code: menuError.code,
        url: 'http://10.11.11.246:8888/menu'
      });
    }

    // Devolver datos del usuario y token
    return res.status(200).json({
      success: true,
      token,
      user: {
        token,
        id: user.id,
        usrcod: user.usrcod,
        usrnom: user.usrnom,
        adm_ciaid: user.adm_ciaid,
        ciaraz,
        adm_rolid: user.adm_rolid,
        rolcod: rol.rolcod,
        roldes: rol.roldes,
        portafolios // <- array de porcod habilitados
      },
      menu: menuData
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
});

module.exports = router;
