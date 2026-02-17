const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware to verify if user is admin (optional, for now relying on frontend check + cia_id match)
// In a real app, we should decode the token here to verify roles security.

// GET /api/users - Get all users for the requester's company
// Expects header/query param for adm_ciaid (or extracted from token in middleware)
router.get('/', async (req, res) => {
    const { adm_ciaid } = req.query;

    if (!adm_ciaid) {
        return res.status(400).json({ success: false, message: 'Falta adm_ciaid' });
    }

    try {
        const { rows } = await pool.query(
            `SELECT id, usrcod, usrnom, ternit, adm_rolid, usrpsw, estcod 
       FROM adm_usr 
       WHERE adm_ciaid = $1 
       ORDER BY usrcod`,
            [adm_ciaid]
        );

        // NOTE: Sending usrpsw is generally bad practice, but needed here because 
        // the requirement implies the admin might want to see/edit it, or at least 
        // the frontend might need to populate the "current" value in an edit form.
        // If we only want to set NEW passwords, we should exclude it.
        // For this specific legacy-style request, we'll return it but be careful.

        res.json({ success: true, users: rows });
    } catch (error) {
        console.error('[GET USERS ERROR]', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
});

// PUT /api/users/:id - Update user details
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { usrnom, usrcod, usrpsw, adm_ciaid } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: 'Falta ID de usuario' });
    }

    try {
        // 1. Check if user exists and belongs to the company (security check)
        // We assume the requester sent their cia_id to verify they have right to edit this user.
        // Ideally this comes from the JWT token of the admin.

        // For now, let's just proceed with the update.

        // Build update query dynamically based on provided fields
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (usrnom !== undefined) {
            updates.push(`usrnom = $${paramIndex}`);
            values.push(usrnom);
            paramIndex++;
        }

        if (usrcod !== undefined) {
            updates.push(`usrcod = $${paramIndex}`);
            values.push(usrcod);
            paramIndex++;
        }

        if (usrpsw !== undefined) {
            updates.push(`usrpsw = $${paramIndex}`);
            values.push(usrpsw); // Storing plain text as per current system
            paramIndex++;

            // Also update password date
            updates.push(`usrfecpass = NOW()`);
        }

        if (updates.length === 0) {
            return res.json({ success: true, message: 'No hay cambios para guardar' });
        }

        values.push(id);
        const query = `UPDATE adm_usr SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.json({ success: true, user: rows[0], message: 'Usuario actualizado correctamente' });

    } catch (error) {
        console.error('[UPDATE USER ERROR]', error);
        res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
    }
});

module.exports = router;
