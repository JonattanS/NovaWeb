const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

function ejecutarPython(tipo, longitud = null) {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '..', 'scripts', 'password_generator.py');
    const args = longitud ? [pythonScript, tipo, longitud.toString()] : [pythonScript, tipo];
    const pythonProcess = spawn('python', args);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(errorOutput));
      }
    });
  });
}

router.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    const nuevaContrasena = await ejecutarPython('password');
    
    res.json({ 
      success: true, 
      message: 'Se ha generado una nueva contraseña',
      password: nuevaContrasena
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al generar contraseña',
      details: error.message 
    });
  }
});

router.post('/generate-2fa', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId es requerido' });
  }

  try {
    const codigo2fa = await ejecutarPython('2fa');
    
    res.json({ 
      success: true, 
      message: 'Código 2FA generado',
      code: codigo2fa
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Error al generar código 2FA',
      details: error.message 
    });
  }
});

module.exports = router;
