# 🔐 Gestión de Sesiones y JWT - Guía Completa

## 📋 Resumen de Cambios

Se implementó un sistema robusto de gestión de sesiones con:
- ✅ **Access Token** de 30 minutos con datos de autorizaciones (roles, portafolios)
- ✅ **Refresh Token** de 7 días
- ✅ **Auto-refresh** de token 5 minutos antes de expirar
- ✅ **Cierre automático** por inactividad (30 minutos)
- ✅ **Registro de logout** en auditoría
- ✅ **Redireccionamiento automático** a login cuando expire
- ✅ **Actualización de autorizaciones** en cada refresh

---

## 🏗️ Arquitectura JWT

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                            │
│                                                          │
│  Usuario → Credenciales → Backend /api/login            │
│                              ↓                           │
│                    Genera Access Token (30m)            │
│            ✨ Incluye: rolcod, portafolios, etc        │
│                    Genera Refresh Token (7d)            │
│                              ↓                           │
│                    Devuelve ambos tokens                │
│                              ↓                           │
│  Frontend almacena:                                      │
│  - User en localStorage (token + roles + portafolios)  │
│  - Access Token en User                                 │
│  - Refresh Token en localStorage                        │
│  - Token expiry time                                    │
└─────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│              TOKEN REFRESH FLOW (Auto)                      │
│                                                             │
│  Access Token activo → UserContext detecta (5 min antes)  │
│                           ↓                                │
│              POST /api/refresh-token                       │
│              Body: { refreshToken }                        │
│                           ↓                                │
│         Backend verifica refresh token (¿válido?)         │
│         Obtiene datos actuales del usuario                │
│         ✨ Incluye: roles, portafolios nuevos             │
│              Genera nuevo Access Token                     │
│                           ↓                                │
│         Frontend actualiza usuario COMPLETO               │
│         (no solo token, sino también roles/portafolios)  │
│         Reinicia timer de refresh automático              │
└────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│           EXPIRY DETECTION FLOW                       │
│                                                       │
│  Monitor: ¿Token expirado? (cada 5 segundos)        │
│                    ↓                                  │
│         SI: Call logout()                            │
│             └─→ POST /api/logout (auditoría)         │
│             └─→ Limpiar localStorage                 │
│             └─→ window.location.href = '/login'      │
└───────────────────────────────────────────────────────┘
```

---

## 📁 Archivos Modificados

### **Backend**

#### `Backend/routes/Login.js`
**Cambios:**
- `ACCESS_TOKEN_DURATION = '30m'` - Duration del access token
- `REFRESH_TOKEN_DURATION = '7d'` - Duration del refresh token
- POST `/api/login` - Devuelve `accessToken`, `refreshToken` y `user` completo
- POST `/api/refresh-token` - Genera nuevo access token E incluye `user` actualizado
- POST `/api/logout` - Registra logout en auditoría

**Payload del Access Token:**
```javascript
{
  id: 5,
  adm_ciaid: 1,
  usrcod: "stiven",
  usrnom: "Stiven Santiago",
  ciaraz: "Nova Corp SAS",
  adm_rolid: 1,
  rolcod: "adm",              // ← IMPORTANTE para autorización
  roldes: "Administrador",    // ← IMPORTANTE para autorización
  portafolios: [1, 2, 3],     // ← IMPORTANTE para autorización
  iat: 1702244400,
  exp: 1702246200
}
```

**Nuevos endpoints:**

```javascript
// POST /api/refresh-token
{
  refreshToken: "eyJhbGc..."
}

Response:
{
  success: true,
  accessToken: "nuevo_token_de_30m",
  expiresIn: 1800,  // segundos
  user: {           // ← AHORA DEVUELVE USER ACTUALIZADO
    token: "nuevo_token_de_30m",
    id: 5,
    usrcod: "stiven",
    usrnom: "Stiven Santiago",
    adm_ciaid: 1,
    ciaraz: "Nova Corp SAS",
    adm_rolid: 1,
    rolcod: "adm",
    roldes: "Administrador",
    portafolios: [1, 2, 3],
    // ... otros datos
  }
}
```

#### `Backend/routes/audit.js`
**Nuevas funciones:**
- `logLogout(adm_ciaid, adm_usrId)` - Registra logout en BD

**Registro de logout:**
```json
{
  "logTip": "LOGOUT",
  "logPro": "LOGIN",
  "logOpe": "LOGOUT",
  "logDet": {
    "usuario": "stiven",
    "nombre": "Stiven Santiago",
    "timestamp": "2025-12-10T17:00:00Z",
    "tipo": "Desconexión del sistema"
  },
  "adm_usrId": 5
}
```

### **Frontend**

#### `Frontend/src/contexts/UserContext.tsx`
**Cambios principales:**

1. **Estado adicional:**
   - `refreshToken` - Almacena refresh token
   - `tokenExpiresAt` - Fecha de expiración del access token

2. **Nueva función:**
   - `refreshAccessToken()` - Llama al backend para refrescar token
   - **Actualiza usuario COMPLETO** (incluyendo portafolios y roles)

3. **Nuevos efectos:**
   - Auto-refresh: Refrescar token 5 minutos antes de expirar
   - Inactividad: Logout después de 30 minutos sin actividad
   - Verificación: Monitorear expiración cada 5 segundos

4. **Logout mejorado:**
   - Registra logout en auditoría
   - Limpia todos los estados
   - Usa `window.location.href` en lugar de `useNavigate()` (evita error de Router)

#### `Frontend/src/pages/Login.tsx`
**Cambios:**
- Recibe `accessToken`, `refreshToken` y `user` (con portafolios/roles) del backend
- Llama a `login()` del UserContext con ambos tokens
- Muestra alerta informativa sobre expiración de sesión
- Usa `useNavigate()` correctamente (está dentro de Router)

---

## 🔄 Flujos de Operación

### **1. Login Exitoso - Obtener Autorización Completa**

```
Usuario ingresa credenciales
         ↓
Backend valida en BD
         ↓
    ┌────┴──────┐
    ↓           ↓
VÁLIDO      INVÁLIDO
    ↓           ↓
Consulta roles   Registra fallo
y portafolios   en auditoría
    ↓           ↓
Genera JWT    Devuelve
(30m + 7d)    error
✨ Payload
  incluye:
  - rolcod
  - portafolios
    ↓
Devuelve tokens
+ user completo
    ↓
Frontend login():
├─ Guarda user EN LOCALSTORAGE (con todos los datos)
├─ Guarda refreshToken EN LOCALSTORAGE
├─ Calcula tokenExpiresAt
└─ Navega a /
```

### **2. Token Por Expirar - Auto-Refresh + Actualizar Autorización**

```
UserContext monitorea tokenExpiresAt
         ↓
¿Faltan 5 minutos para expirar?
         ↓
        SÍ
         ↓
POST /api/refresh-token
    Body: { refreshToken }
         ↓
Backend verifica refresh token
Consulta datos ACTUALES del usuario
(roles y portafolios pueden haber cambiado)
         ↓
    ┌─────┴──────┐
    ↓            ↓
VÁLIDO      EXPIRADO
    ↓            ↓
Genera     Devuelve
nuevo      error
access     
token
+user
    ↓
Frontend:
├─ setUser(data.user)  ← ACTUALIZA USUARIO COMPLETO
│  (incluyendo roles/portafolios nuevos)
├─ Recalcula tokenExpiresAt
└─ Reinicia timer auto-refresh
```

### **3. Inactividad (30 minutos)**

```
Usuario NO interactúa
         ↓
Timer de 30 minutos corre
         ↓
¿Sin eventos? (mouse, teclado, scroll, click)
         ↓
       SÍ
         ↓
call logout()
    ├─ POST /api/logout → auditoría
    ├─ Limpia localStorage
    └─ window.location.href = '/login'
```

### **4. Token Expirado (Monitoreo)**

```
Verificación cada 5 segundos:
¿Date.now() > tokenExpiresAt?
         ↓
       SÍ
         ↓
Token expirado
         ↓
call logout(true)  ← skip audit
    ├─ NO hace POST /api/logout
    ├─ Limpia localStorage
    └─ window.location.href = '/login'
```

---

## 💾 Almacenamiento en localStorage

```javascript
// user (actualizado en login Y en cada refresh)
{
  "token": "eyJhbGc...",           // Access token de 30m
  "id": 5,
  "usrcod": "stiven",
  "usrnom": "Stiven Santiago",
  "adm_ciaid": 1,
  "ciaraz": "Nova Corp SAS",
  "adm_rolid": 1,
  "rolcod": "adm",                // ← Para autorización (se actualiza en refresh)
  "roldes": "Administrador",      // ← Para autorización (se actualiza en refresh)
  "portafolios": [1, 2, 3]        // ← Para autorización (se actualiza en refresh)
}

// refreshToken (no expira durante 7 días)
"eyJhbGc..."
```

---

## 📊 Auditoría Registrada

### **Login Exitoso**
```sql
INSERT INTO adm_log VALUES (
  DEFAULT,
  1,                              -- adm_ciaid
  'LOGIN_EXITOSO',               -- logTip
  'LOGIN',                        -- logPro
  0, 0, 0,                        -- logGru, logSec, adm_menId
  'LOGIN',                        -- logOpe
  '{"usuario":"stiven"...}',     -- logDet JSON
  5,                              -- adm_usrId
  NOW()                           -- logFec
);
```

### **Login Fallido**
```sql
INSERT INTO adm_log VALUES (
  DEFAULT,
  1,                              -- adm_ciaid
  'LOGIN_FALLIDO',               -- logTip
  'LOGIN',                        -- logPro
  0, 0, 0,
  'LOGIN',
  '{"usuario":"xxx","razon":"Usuario no existe"}',
  NULL,                           -- adm_usrId = NULL
  NOW()
);
```

### **Logout/Desconexión**
```sql
INSERT INTO adm_log VALUES (
  DEFAULT,
  1,                              -- adm_ciaid
  'LOGOUT',                       -- logTip
  'LOGIN',                        -- logPro
  0, 0, 0,
  'LOGOUT',                       -- logOpe
  '{"usuario":"stiven","tipo":"Desconexión del sistema"}',
  5,                              -- adm_usrId
  NOW()
);
```

---

## 🧪 Casos de Prueba

### **Test 1: Verificar portafolios/roles en login**
```bash
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"usrcod":"stiven","usrpsw":"password123"}'

Response:
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 1800,
  "user": {
    "rolcod": "adm",           // ← IMPORTANTE
    "portafolios": [1, 2, 3], // ← IMPORTANTE
    ...
  }
}
```

### **Test 2: Refresh token - Verificar roles/portafolios actualizados**
```bash
curl -X POST http://localhost:3002/api/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGc..."}'

Response:
{
  "success": true,
  "accessToken": "nuevo_eyJhbGc...",
  "expiresIn": 1800,
  "user": {                    // ← AHORA DEVUELVE USER
    "rolcod": "adm",            // ← Actualizado si cambió
    "portafolios": [1, 2, 3],  // ← Actualizado si cambió
    ...
  }
}
```

### **Test 3: Verificar autorizaciones en navegador**
```javascript
// En consola del navegador
const user = JSON.parse(localStorage.getItem('user'));
console.log('Rol:', user.rolcod);        // "adm"
console.log('Portafolios:', user.portafolios); // [1, 2, 3]
```

### **Test 4: Logout Manual**
```bash
curl -X POST http://localhost:3002/api/logout \
  -H "Content-Type: application/json" \
  -d '{"usrId":5,"adm_ciaid":1}'

Response:
{
  "success": true,
  "message": "Logout registrado"
}
```

---

## ⏱️ Timeline de Eventos (Ejemplo)

```
14:00:00 - Usuario login
          ├─ Recibe access token (válido hasta 14:30)
          ├─ rolcod: "adm", portafolios: [1, 2, 3]
          ├─ Recibe refresh token (válido hasta próxima semana)
          └─ Log: LOGIN_EXITOSO

14:01:00 - Usuario activo (mousemove)
          └─ Reinicia timer de inactividad (30m)

14:20:00 - Admin MODIFICA roles del usuario en BD
          ├─ Cambia: rolcod de "adm" a "user"
          ├─ Cambia: portafolios de [1,2,3] a [1]
          └─ Usuario NO se enteró aún (seguirá con datos viejos)

14:25:00 - Inactividad: 24 minutos
          ├─ UserContext verifica: ¿expira en 5 min?
          ├─ SÍ → POST /api/refresh-token
          ├─ Backend consulta BD ACTUAL
          ├─ Devuelve: rolcod: "user", portafolios: [1]
          ├─ Frontend actualiza user en localStorage
          └─ Ahora tiene autorizaciones actualizadas ✨

14:30:00 - Usuario inactivo 30 minutos
          ├─ Timer de inactividad se cumple
          ├─ call logout()
          ├─ POST /api/logout
          ├─ Log: LOGOUT
          └─ Redirige a /login
```

---

## 🚨 Manejo de Errores

### **Refresh Token Expirado (>7 días)**
```
POST /api/refresh-token
         ↓
Backend: jwt.verify() falla
         ↓
Response: 401 Unauthorized
{
  "success": false,
  "message": "Refresh token expirado"
}
         ↓
Frontend: call logout()
└─→ Redirige a login
```

### **Token Inválido/Corrupto**
```
POST /api/refresh-token
         ↓
Backend: jwt.verify() falla
         ↓
Response: 401 Unauthorized
{
  "success": false,
  "message": "Token inválido"
}
         ↓
Frontend: call logout()
```

### **Usuario Eliminado (token aún válido)**
```
POST /api/refresh-token
User token aún válido
         ↓
Backend: SELECT usuario → no encontrado
         ↓
Response: 401 Unauthorized
{
  "success": false,
  "message": "Usuario no encontrado"
}
         ↓
Frontend: call logout()
```

---

## 🔒 Seguridad

✅ **Implementado:**
- Access token corta duración (30 min)
- Refresh token larga duración (7 días)
- Auto-refresh transparente 5 min antes
- Cierre automático por inactividad
- Logout registrado en auditoría
- Tokens NO se guardan en cookies (localStorage protegido)
- Validación en cada refresh
- **Actualización de autorizaciones en cada refresh** (critical)

⚠️ **Consideraciones futuras:**
- Implementar HTTPS en producción (tokens en header Authorization)
- Usar HttpOnly cookies para refresh token
- Implementar token blacklist en logout
- Rate limiting en endpoint /refresh-token
- Rotación de refresh tokens

---

## 📝 Duración de Tokens

| Token | Duración | Uso |
|-------|----------|-----|
| Access Token | 30 minutos | API requests, mantener sesión activa, contiene roles y portafolios |
| Refresh Token | 7 días | Renovar access token cuando expira |
| Inactividad | 30 minutos | Logout automático sin refresh |

---

## 🔧 Configuración (si necesitas cambiar)

**Backend (`Backend/routes/Login.js`):**
```javascript
const ACCESS_TOKEN_DURATION = '30m';      // Cambiar duración access token
const REFRESH_TOKEN_DURATION = '7d';      // Cambiar duración refresh token
```

**Frontend (`Frontend/src/contexts/UserContext.tsx`):**
```javascript
// Timer para refrescar (5 minutos antes de expirar)
const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 1000);

// Timer de inactividad (30 minutos)
}, 30 * 60 * 1000); // 30 minutos

// Verificación de expiración (cada 5 segundos)
}, 5000); // Verificar cada 5 segundos
```

---

## ✅ Resumen de Implementación

### **Backend**
- ✅ Access Token: 30 minutos con portafolios/roles
- ✅ Refresh Token: 7 días
- ✅ Endpoint `/api/refresh-token` devuelve user actualizado
- ✅ Endpoint `/api/logout` con auditoría
- ✅ Tipos de log: LOGIN_EXITOSO, LOGIN_FALLIDO, LOGOUT
- ✅ Portafolios y roles incluidos en cada refresh

### **Frontend**
- ✅ Auto-refresh 5 min antes de expirar
- ✅ Logout automático por inactividad
- ✅ Monitoreo de expiración
- ✅ Redireccionamiento automático a login
- ✅ Almacenamiento seguro en localStorage
- ✅ Actualización de usuario COMPLETO en refresh
- ✅ Rol y portafolios siempre actualizados

### **Auditoría**
- ✅ Registro de login exitoso
- ✅ Registro de login fallido
- ✅ Registro de logout/desconexión
- ✅ Todos con timestamp y detalles

---

**Versión:** 2.1.0  
**Fecha:** 2025-12-10  
**Estado:** ✅ Implementado y Funcional  
**Mejora:** Se agregó actualización de autorizaciones en cada refresh
