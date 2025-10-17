const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

// Usar middleware de autenticación en todos los endpoints
router.use(verifyToken);

// Obtener módulos por portafolio con control de roles
router.get('/by-portfolio/:porcod', async (req, res) => {
  const { porcod } = req.params;
  const adm_ciaid = req.user?.adm_ciaid; // Extraído del token JWT
  const adm_rolid = req.user?.adm_rolid; // Extraído del token JWT
  
  if (!adm_ciaid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de compañía no encontrado en el token" 
    });
  }

  if (!adm_rolid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de rol no encontrado en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        nm.id,
        nm.adm_ciaid,
        nm.adm_menid,
        nm.mencod,
        nm.mennom,
        nm.parameters,
        nm.menord,
        nm.mencodpad,
        nm.id_menu,
        nm.adm_gentfnc,
        nm.porcod,
        nm.menniv,
        nm.menter,
        nm.mensis,
        nm.estcod,
        nm.mencontroler,
        nm.menurl,
        nm.mennov,
        nmr.mencreate,
        nmr.menupdate,
        nmr.mendelete,
        nmr.menaccess,
        nmr.menexport,
        nmr.menprint
      FROM nov_men nm
      INNER JOIN nov_men_rol nmr ON nm.id = nmr.nov_menid
      WHERE nm.adm_ciaid = $1 
        AND nm.porcod = $2 
        AND nm.estcod = 6
        AND nmr.adm_ciaid = $1
        AND nmr.adm_rolid = $3
        AND nmr.menaccess = true
      ORDER BY nm.menord ASC, nm.mennom ASC
    `, [adm_ciaid, porcod, adm_rolid]);

    res.json({ 
      success: true, 
      modules: result.rows,
      portfolio: porcod,
      company: adm_ciaid,
      role: adm_rolid
    });

  } catch (err) {
    console.error('Error obteniendo módulos por portafolio con roles:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

// Obtener todos los módulos de la compañía con control de roles
router.get('/all', async (req, res) => {
  const adm_ciaid = req.user?.adm_ciaid;
  const adm_rolid = req.user?.adm_rolid;
  
  if (!adm_ciaid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de compañía no encontrado en el token" 
    });
  }

  if (!adm_rolid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de rol no encontrado en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        nm.id,
        nm.adm_ciaid,
        nm.adm_menid,
        nm.mencod,
        nm.mennom,
        nm.parameters,
        nm.menord,
        nm.mencodpad,
        nm.id_menu,
        nm.adm_gentfnc,
        nm.porcod,
        nm.menniv,
        nm.menter,
        nm.mensis,
        nm.estcod,
        nm.mencontroler,
        nm.menurl,
        nm.mennov,
        nmr.mencreate,
        nmr.menupdate,
        nmr.mendelete,
        nmr.menaccess,
        nmr.menexport,
        nmr.menprint
      FROM nov_men nm
      INNER JOIN nov_men_rol nmr ON nm.id = nmr.nov_menid
      WHERE nm.adm_ciaid = $1 
        AND nm.estcod = 6
        AND nmr.adm_ciaid = $1
        AND nmr.adm_rolid = $2
        AND nmr.menaccess = true
      ORDER BY nm.porcod ASC, nm.menord ASC, nm.mennom ASC
    `, [adm_ciaid, adm_rolid]);

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
      company: adm_ciaid,
      role: adm_rolid
    });

  } catch (err) {
    console.error('Error obteniendo todos los módulos con roles:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

// Obtener un módulo específico con permisos
router.get('/module/:id', async (req, res) => {
  const { id } = req.params;
  const adm_ciaid = req.user?.adm_ciaid;
  const adm_rolid = req.user?.adm_rolid;
  
  if (!adm_ciaid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de compañía no encontrado en el token" 
    });
  }

  if (!adm_rolid) {
    return res.status(400).json({ 
      success: false, 
      message: "ID de rol no encontrado en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        nm.id,
        nm.adm_ciaid,
        nm.adm_menid,
        nm.mencod,
        nm.mennom,
        nm.parameters,
        nm.menord,
        nm.mencodpad,
        nm.id_menu,
        nm.adm_gentfnc,
        nm.porcod,
        nm.menniv,
        nm.menter,
        nm.mensis,
        nm.estcod,
        nm.mencontroler,
        nm.menurl,
        nm.mennov,
        nmr.mencreate,
        nmr.menupdate,
        nmr.mendelete,
        nmr.menaccess,
        nmr.menexport,
        nmr.menprint
      FROM nov_men nm
      INNER JOIN nov_men_rol nmr ON nm.id = nmr.nov_menid
      WHERE nm.id = $1 
        AND nm.adm_ciaid = $2 
        AND nm.estcod = 6
        AND nmr.adm_ciaid = $2
        AND nmr.adm_rolid = $3
        AND nmr.menaccess = true
    `, [id, adm_ciaid, adm_rolid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Módulo no encontrado o sin permisos de acceso' 
      });
    }

    res.json({ 
      success: true, 
      module: result.rows[0]
    });

  } catch (err) {
    console.error('Error obteniendo módulo específico con roles:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

// Verificar permisos específicos de un módulo
router.get('/permissions/:mencod', async (req, res) => {
  const { mencod } = req.params;
  const adm_ciaid = req.user?.adm_ciaid;
  const adm_rolid = req.user?.adm_rolid;
  
  if (!adm_ciaid || !adm_rolid) {
    return res.status(400).json({ 
      success: false, 
      message: "Datos de usuario incompletos en el token" 
    });
  }

  try {
    const result = await pool.query(`
      SELECT 
        nmr.mencreate,
        nmr.menupdate,
        nmr.mendelete,
        nmr.menaccess,
        nmr.menexport,
        nmr.menprint
      FROM nov_men nm
      INNER JOIN nov_men_rol nmr ON nm.id = nmr.nov_menid
      WHERE nm.mencod = $1 
        AND nm.adm_ciaid = $2
        AND nmr.adm_ciaid = $2
        AND nmr.adm_rolid = $3
    `, [mencod, adm_ciaid, adm_rolid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Módulo no encontrado o sin permisos' 
      });
    }

    res.json({ 
      success: true, 
      permissions: result.rows[0]
    });

  } catch (err) {
    console.error('Error obteniendo permisos del módulo:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      message: err.message 
    });
  }
});

module.exports = router;
