# Implementación de Auditoría de Logins

Guía completa para implementar el sistema de auditoría de logins en NovaWeb.

## 📋 Descripción

Este sistema registra automáticamente:
- ✅ **Logins exitosos**: Cuando un usuario inicia sesión correctamente
- ❌ **Logins fallidos**: Cuando falla la autenticación (usuario no existe, contraseña incorrecta)
- 📊 **Información detallada**: Usuario, fecha/hora, razón de fallo, etc.

## 🗄️ Paso 1: Crear la tabla en PostgreSQL

Ejecuta el script SQL en tu base de datos PostgreSQL:

```bash
psql -U tu_usuario -d tu_base_datos -f Backend/SQL/create_audit_table.sql
```

O ejecuta manualmente en pgAdmin/psql:

```sql
CREATE TABLE IF NOT EXISTS adm_log (
    id SERIAL PRIMARY KEY,
    adm_ciaid INTEGER NOT NULL,
    logTip VARCHAR(20) NOT NULL,
    logPro VARCHAR(20) NOT NULL,
    logGru INTEGER NOT NULL DEFAULT 0,
    logSec INTEGER NOT NULL DEFAULT 0,
    adm_menId INTEGER NOT NULL DEFAULT 0,
    logOpe VARCHAR(5) NOT NULL,
    logDet TEXT,
    adm_usrId INTEGER,
    logFec TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_adm_log_cia FOREIGN KEY (adm_ciaid)
        REFERENCES adm_cia(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_adm_log_men FOREIGN KEY (adm_menId)
        REFERENCES adm_men(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_adm_log_usr FOREIGN KEY (adm_usrId)
        REFERENCES adm_usr(id) ON DELETE SET NULL
);

-- Crear índices
CREATE INDEX idx_adm_log_adm_ciaid ON adm_log(adm_ciaid);
CREATE INDEX idx_adm_log_adm_usrId ON adm_log(adm_usrId);
CREATE INDEX idx_adm_log_logTip ON adm_log(logTip);
CREATE INDEX idx_adm_log_logFec ON adm_log(logFec);
CREATE INDEX idx_adm_log_logPro ON adm_log(logPro);
```

## 🔧 Paso 2: Verificar archivos del backend

Verifica que los siguientes archivos existan:

```
Backend/
├── routes/
│   ├── Login.js          ✅ (modificado - con auditoría)
│   ├── audit.js          ✅ (nuevo - servicio de auditoría)
│   └── auditLogs.js      ✅ (nuevo - endpoints de consulta)
├── server.js             ✅ (modificado - registra rutas)
└── SQL/
    └── create_audit_table.sql  ✅ (nuevo - SQL)
```

## 🚀 Paso 3: Reiniciar el backend

Detén y reinicia tu servidor Node.js:

```bash
cd Backend
npm install  # Por si falta algún paquete
node server.js
```

## 📊 API Endpoints

### 1. Obtener logs de auditoría

**GET** `/api/audit-logs`

Parámetros query opcionales:
- `logTip`: Filtrar por tipo (`LOGIN_EXITOSO`, `LOGIN_FALLIDO`)
- `logPro`: Filtrar por proceso (`LOGIN`, `QUERY`, etc)
- `adm_usrId`: Filtrar por usuario ID
- `adm_ciaid`: Filtrar por compañía ID
- `startDate`: Fecha inicio (YYYY-MM-DD)
- `endDate`: Fecha fin (YYYY-MM-DD)
- `page`: Número de página (default: 1)
- `limit`: Registros por página (default: 20, máx: 100)

Ejemplo:
```bash
curl "http://localhost:3002/api/audit-logs?logTip=LOGIN_EXITOSO&page=1&limit=20"
```

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "adm_ciaid": 1,
      "logTip": "LOGIN_EXITOSO",
      "logPro": "LOGIN",
      "logGru": 0,
      "logSec": 0,
      "adm_menId": 0,
      "logOpe": "LOGIN",
      "logDet": "{\"usuario\":\"stiven\",\"nombre\":\"Stiven\",\"timestamp\":\"2025-12-09T21:35:00Z\",\"tipo\":\"Login exitoso\"}",
      "adm_usrId": 5,
      "logFec": "2025-12-09T21:35:00Z",
      "usuario": "stiven",
      "usuario_nombre": "Stiven",
      "empresa": "Nova Corp SAS"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

### 2. Obtener resumen de auditoría

**GET** `/api/audit-logs/summary`

Parámetros query opcionales:
- `adm_ciaid`: Filtrar por compañía
- `days`: Últimos N días (default: 7)

Ejemplo:
```bash
curl "http://localhost:3002/api/audit-logs/summary?days=30&adm_ciaid=1"
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "byType": [
      {"logTip": "LOGIN_EXITOSO", "cantidad": 45},
      {"logTip": "LOGIN_FALLIDO", "cantidad": 3}
    ],
    "byUser": [
      {"id": 5, "usrcod": "stiven", "usrnom": "Stiven", "cantidad": 12},
      {"id": 1, "usrcod": "admin", "usrnom": "Administrador", "cantidad": 8}
    ],
    "byProcess": [
      {"logPro": "LOGIN", "cantidad": 48}
    ]
  },
  "period": "Últimos 30 días"
}
```

## 🧪 Pruebas

### Probar login exitoso:
1. Abre la app en el navegador
2. Ingresa credenciales válidas
3. Verifica en la BD:
   ```sql
   SELECT * FROM adm_log WHERE logTip = 'LOGIN_EXITOSO' ORDER BY logFec DESC LIMIT 5;
   ```

### Probar login fallido:
1. Abre la app en el navegador
2. Ingresa credenciales inválidas (contraseña incorrecta)
3. Verifica en la BD:
   ```sql
   SELECT * FROM adm_log WHERE logTip = 'LOGIN_FALLIDO' ORDER BY logFec DESC LIMIT 5;
   ```

## 📝 Detalles de implementación

### Archivos modificados:

#### `Backend/routes/Login.js`
- Importa funciones de auditoría (`logLoginSuccess`, `logLoginFailure`)
- Registra login exitoso tras autenticación correcta
- Registra login fallido si:
  - Usuario no existe
  - Contraseña es incorrecta

#### `Backend/routes/audit.js` (nuevo)
Servicio centralizado que:
- `createAuditLog()`: Función general para registrar logs
- `logLoginSuccess()`: Registra logins exitosos
- `logLoginFailure()`: Registra logins fallidos

#### `Backend/routes/auditLogs.js` (nuevo)
Endpoints para consultar logs:
- `GET /api/audit-logs`: Lista logs con filtros
- `GET /api/audit-logs/summary`: Resumen estadístico

#### `Backend/server.js`
- Registra la ruta de auditoría: `app.use('/api', auditLogsRouter)`

## 🔐 Consideraciones de seguridad

✅ **Lo que ya está implementado:**
- Logs no interrumpen el flujo de login (try-catch)
- Las contraseñas NO se guardan en los logs
- Solo se registra el hash/resumen en `logDet`
- Relaciones con foreign keys protegen integridad

⚠️ **Recomendaciones futuras:**
- Implementar encriptación de `logDet` si es sensible
- Agregar límite de retención (eliminar logs > 90 días)
- Implementar autenticación en los endpoints de auditoría
- Agregar rate limiting en `/api/audit-logs`

## 🐛 Solución de problemas

### Error: "table adm_log does not exist"
✅ Solución: Ejecuta el SQL del Paso 1

### Error: "Cannot find module './audit'"
✅ Solución: Verifica que `Backend/routes/audit.js` existe

### Los logs no se guardan
✅ Soluciones:
1. Verifica que la tabla existe: `SELECT * FROM adm_log LIMIT 1;`
2. Revisa los logs del backend en console
3. Confirma que el pool de PostgreSQL está conectado
4. Verifica que `adm_ciaid` es válido (existe en `adm_cia`)

## 📚 Estructura de datos en `logDet`

El campo `logDet` contiene un JSON con:

**Login exitoso:**
```json
{
  "usuario": "stiven",
  "nombre": "Stiven",
  "timestamp": "2025-12-09T21:35:00Z",
  "tipo": "Login exitoso"
}
```

**Login fallido:**
```json
{
  "usuario": "stiven",
  "razon": "Contraseña incorrecta",
  "timestamp": "2025-12-09T21:35:00Z",
  "tipo": "Login fallido"
}
```

## 🎯 Próximos pasos

1. ✅ Crear frontend para visualizar logs de auditoría
2. ✅ Agregar filtros avanzados
3. ✅ Exportar a CSV/PDF
4. ✅ Agregar alertas en tiempo real
5. ✅ Implementar auditoría para otras operaciones (no solo login)

---

**Última actualización:** 2025-12-09  
**Versión:** 1.0.0
