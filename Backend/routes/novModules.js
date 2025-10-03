const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

// Usar middleware de autenticación en todos los endpoints
router.use(verifyToken);

// Obtener módulos por portafolio basado en adm_ciaid del token JWT
router.get('/by-portfolio/:porcod', async (req, res) => {
  const { porcod } = req.params;
  const adm_ciaid = req.user?.adm_ciaid; // Extraído del token JWT
  
  if (!adm_ciaid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de compañía no encontrado en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id,
        adm_ciaid,
        adm_menid,
        mencod,
        mennom,
        parameters,
        menord,
        mencodpad,
        id_menu,
        adm_gentfnc,
        porcod,
        menniv,
        menter,
        mensis,
        estcod,
        mencontroler,
        menurl,
        mennov
      FROM nov_men 
      WHERE adm_ciaid = $1 AND porcod = $2 AND estcod = 6
      ORDER BY menord ASC, mennom ASC
    `, [adm_ciaid, porcod]);

    res.json({ 
      success: true, 
      modules: result.rows,
      portfolio: porcod,
      company: adm_ciaid
    });

  } catch (err) {
    console.error('Error obteniendo módulos por portafolio:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

// Obtener todos los módulos de la compañía (todos los portafolios)
router.get('/all', async (req, res) => {
  const adm_ciaid = req.user?.adm_ciaid;
  
  if (!adm_ciaid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de compañía no encontrado en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id,
        adm_ciaid,
        adm_menid,
        mencod,
        mennom,
        parameters,
        menord,
        mencodpad,
        id_menu,
        adm_gentfnc,
        porcod,
        menniv,
        menter,
        mensis,
        estcod,
        mencontroler,
        menurl,
        mennov
      FROM nov_men 
      WHERE adm_ciaid = $1 AND estcod = 6
      ORDER BY porcod ASC, menord ASC, mennom ASC
    `, [adm_ciaid]);

    // Agrupar por portafolio
    const modulesByPortfolio = result.rows.reduce((acc, module) => {
      if (!acc[module.porcod]) {
        acc[module.porcod] = [];
      }
      acc[module.porcod].push(module);
      return acc;
    }, {});

    res.json({ 
      success: true, 
      modules: result.rows,
      modulesByPortfolio,
      company: adm_ciaid
    });

  } catch (err) {
    console.error('Error obteniendo todos los módulos:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

// Obtener un módulo específico
router.get('/module/:id', async (req, res) => {
  const { id } = req.params;
  const adm_ciaid = req.user?.adm_ciaid;
  
  if (!adm_ciaid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de compañía no encontrado en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        id,
        adm_ciaid,
        adm_menid,
        mencod,
        mennom,
        parameters,
        menord,
        mencodpad,
        id_menu,
        adm_gentfnc,
        porcod,
        menniv,
        menter,
        mensis,
        estcod,
        mencontroler,
        menurl,
        mennov
      FROM nov_men 
      WHERE id = $1 AND adm_ciaid = $2 AND estcod = 6
    `, [id, adm_ciaid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Módulo no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      module: result.rows[0]
    });

  } catch (err) {
    console.error('Error obteniendo módulo específico:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

module.exports = router;
