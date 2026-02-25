# 🔧 Solución: Error 500 en Audit Log Viewer

## 🚨 El Problema

Al acceder a `/AuditLogViewer`, recibes este error:
```
GET /api/audit-logs?page=1&limit=20&adm_ciaid=1 500 (Internal Server Error)
```

Esto significa que **la tabla `adm_log` no existe** en tu base de datos PostgreSQL.

---

## ✅ Solución Rápida

### **Paso 1: Ejecutar el Script SQL**

Desde tu cliente PostgreSQL (psql, pgAdmin, o DBeaver):

```bash
# Si usas psql desde terminal:
psql -U tu_usuario -d tu_base_datos -f Backend/SQL/02_audit_logs.sql
```

O copia el contenido de `Backend/SQL/02_audit_logs.sql` y ejecuta directamente en tu cliente SQL.

### **Paso 2: Verificar que la Tabla fue Creada**

```sql
-- En psql:
\d adm_log

-- O en cualquier cliente SQL:
SELECT * FROM adm_log LIMIT 1;
```

Debería retornar una tabla vacía (o si ya hay datos, los mostrará).

### **Paso 3: (Opcional) Insertar Datos de Prueba**

Si quieres agregar datos de prueba, descomenta las líneas en `Backend/SQL/02_audit_logs.sql`:

```sql
INSERT INTO adm_log (
  adm_ciaid, logTip, logPro, logGru, logSec,
  logOpe, logDet, adm_usrId, logFec
) VALUES (
  1, 'LOGIN_EXITOSO', 'LOGIN', 'AUTENTICACION', 'USUARIOS',
  'Login exitoso', '{"ip":"192.168.1.1"}', 1, CURRENT_TIMESTAMP
);
```

### **Paso 4: Recargar en el Navegador**

Vuelve a acceder a `http://tu-app/AuditLogViewer`

✅ Ahora debería funcionar correctamente!

---

## 📊 Estructura de la Tabla `adm_log`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | SERIAL PRIMARY KEY | Identificador único |
| `adm_ciaid` | INTEGER | ID de la compañía/empresa |
| `logTip` | VARCHAR(50) | Tipo: LOGIN_EXITOSO, LOGIN_FALLIDO, CONSULTA, etc |
| `logPro` | VARCHAR(100) | Proceso: LOGIN, REPORTE, UPDATE, DELETE, etc |
| `logGru` | VARCHAR(100) | Grupo de la acción |
| `logSec` | VARCHAR(100) | Sección del sistema |
| `adm_menId` | INTEGER | ID del menú/módulo |
| `logOpe` | VARCHAR(255) | Operación realizada (descripción) |
| `logDet` | TEXT | Detalles (puede ser JSON) |
| `adm_usrId` | INTEGER | ID del usuario que actuó |
| `logFec` | TIMESTAMP | Fecha y hora del evento |

---

## 🐛 Si Sigue Fallando

### Opción 1: Verificar el Nombre de la Tabla

Si tu tabla de logs tiene otro nombre (ej: `audit_log`, `sys_log`), actualiza:

**Archivo:** `Backend/routes/auditLogs.js`

Busca todas las referencias a `adm_log` y reemplaza con el nombre correcto:

```javascript
// ANTES
FROM adm_log al

// DESPUÉS (si tu tabla se llama audit_log)
FROM audit_log al
```

### Opción 2: Ver el Error Exacto en los Logs del Backend

Revisa la consola del backend (donde corre `node server.js`):

```bash
[AUDIT LOGS ERROR] { message: '...', code: '...', detail: '...' }
```

Este mensaje te dirá exactamente qué falta.

### Opción 3: Agregar Debug al Endpoint

Actualiza `Backend/routes/auditLogs.js` para ver más detalles:

```javascript
router.get('/audit-logs', async (req, res) => {
  try {
    console.log('[AUDIT LOGS] Iniciando consulta...');
    console.log('[AUDIT LOGS] Query params:', req.query);
    
    // Test: Verificar conexión
    const testQuery = await pool.query('SELECT 1 as test');
    console.log('[AUDIT LOGS] DB OK');
    
    // Test: Verificar tabla
    const tableCheck = await pool.query(`
      SELECT to_regclass('public.adm_log') IS NOT NULL as exists
    `);
    console.log('[AUDIT LOGS] Table exists:', tableCheck.rows[0]);
    
    // ... resto del código
  } catch (error) {
    console.error('[AUDIT LOGS ERROR]', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    res.status(500).json({ error: error.message });
  }
});
```

Recarga el endpoint y revisa qué error específico sale.

---

## 📋 Checklist

- [ ] Ejecuté `Backend/SQL/02_audit_logs.sql` en PostgreSQL
- [ ] Verifiqué con `\d adm_log` que la tabla existe
- [ ] La tabla tiene relaciones con `adm_usr` y `adm_cia`
- [ ] El backend corre sin errores en la consola
- [ ] El frontend carga la página `/AuditLogViewer`
- [ ] El endpoint `/api/audit-logs` retorna datos (status 200)
- [ ] La tabla muestra los logs correctamente

---

## 🚀 Endpoints Disponibles

### GET `/api/audit-logs`

Obtiene logs con paginación y filtros:

```
GET /api/audit-logs?page=1&limit=20&adm_ciaid=1&logTip=LOGIN_EXITOSO&startDate=2025-12-01&endDate=2025-12-31
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "logTip": "LOGIN_EXITOSO",
      "logPro": "LOGIN",
      "usuario": "admin",
      "usuario_nombre": "Administrador",
      "empresa": "Mi Empresa",
      "logFec": "2025-12-12T10:30:00Z",
      "logDet": "{\"ip\":\"192.168.1.1\"}"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

### GET `/api/audit-logs/summary`

Obtiene resumen de logs:

```
GET /api/audit-logs/summary?adm_ciaid=1&days=7
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "byType": [
      { "logTip": "LOGIN_EXITOSO", "cantidad": 120 },
      { "logTip": "LOGIN_FALLIDO", "cantidad": 5 }
    ],
    "byUser": [ ... ],
    "byProcess": [ ... ]
  },
  "period": "Últimos 7 días"
}
```

---

## 📞 ¿Necesitas más ayuda?

Si después de seguir estos pasos sigue fallando, proporciona:

1. La salida exacta del error en la consola del backend
2. El resultado de `\d adm_log` en psql
3. Tu versión de PostgreSQL (`SELECT version();`)
4. El contenido de `Backend/db.js` para verificar la configuración de conexión

---

**Documento de Referencia:** `audit_logs_fix.md`
**Fecha:** 2025-12-12
**Estado:** ✅ Listo para usar
