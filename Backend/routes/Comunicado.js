const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Ruta POST para ejecutar el script
router.post('/ejecutar-comunicado', (req, res) => {
    // Ruta absoluta a tu script
    const scriptPath = path.join('S:', 'Desarrollo', '0MariaPaula', 'merges', 'Comunicado.py');

    try {
        // Ejecutar el script usando Python
        const proceso = spawn('python', [scriptPath]);

        let output = '';
        let errorOutput = '';

        proceso.stdout.on('data', (data) => {
            output += data.toString();
        });

        proceso.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proceso.on('close', (code) => {
            res.json({
                success: code === 0,
                output,
                error: errorOutput,
                exitCode: code
            });
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
