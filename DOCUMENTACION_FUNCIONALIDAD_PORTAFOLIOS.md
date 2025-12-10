# 📋 Funcionamiento de Portafolios y Módulos - Documentación

## 🎯 Lógica Principal

La aplicación funciona con la siguiente lógica **CLAVE** para mostrar portafolios y módulos:

### **1. UserContext - Almacenamiento del Usuario**

Cuando el usuario hace login:

```typescript
// El backend devuelve todo el usuario incluyendo:
{
  token: "...",
  id: 5,
  usrcod: "stiven",
  usrnom: "Stiven Santiago",
  adm_ciaid: 1,
  ciaraz: "Nova Corp SAS",
  adm_rolid: 1,
  rolcod: "adm",
  roldes: "Administrador",
  portafolios: [1, 2, 3]  // ← CRÍTICO: Array de IDs de portafolios
}
```

### **2. AppSidebar.tsx - Lectura de Portafolios**

El sidebar lee directamente del UserContext:

```typescript
const { user } = useUser()
const portafoliosPermitidos: number[] = user?.portafolios || []
```

**SI esto es undefined o está vacío → No se cargan portafolios**

### **3. Relación en Base de Datos**

La lógica que permite que un usuario vea portafolios está en:

```sql
-- Tabla: adm_usr (Usuarios)
SELECT adm_usrid, usrcod, usrnom FROM adm_usr WHERE adm_usrid = 5

-- Tabla: adm_por (Portafolios)  
SELECT porcod, prddes FROM adm_por WHERE porcod IN (1, 2, 3)

-- Tabla: adm_usr_por (Relación Usuario-Portafolio) ← LA CLAVE
SELECT adm_usrid, porcod FROM adm_usr_por WHERE adm_usrid = 5
-- Devuelve: [(5, 1), (5, 2), (5, 3)]
```

**ESTE es el query que genera el array de `portafolios`**

### **4. Flujo Completo de Carga**

```
┌─────────────────────────────────────────┐
│ Usuario Hace Login                      │
│ POST /api/login                         │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Backend Login.js:                       │
│ 1. SELECT usuario FROM adm_usr          │
│ 2. SELECT porcod FROM adm_usr_por       │  ← Obtiene portafolios
│    WHERE adm_usrid = usuario.id         │
│ 3. Devuelve user con portafolios array  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Frontend Login.tsx:                     │
│ - Recibe user con portafolios: [1,2,3] │
│ - Llama login(userData)                 │
│ - Guarda en localStorage                │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ UserContext:                            │
│ - setUser(userData)                     │
│ - user.portafolios = [1,2,3]            │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ AppSidebar.tsx:                         │
│ const portafoliosPermitidos =           │
│   user?.portafolios || []               │
│                                         │
│ → portafoliosPermitidos = [1,2,3] ✅    │
│ → Carga módulos para cada portafolio    │
└─────────────────────────────────────────┘
```

---

## 🔧 Archivos Clave

### **Backend: `Backend/routes/Login.js`**

Debe incluir esta lógica:

```javascript
// POST /api/login
async (req, res) => {
  try {
    const { usrcod, usrpsw } = req.body
    
    // 1. Validar usuario
    const usuario = await db.query(
      'SELECT * FROM adm_usr WHERE usrcod = ? AND usrpsw = PASSWORD(?)',
      [usrcod, usrpsw]
    )
    
    if (!usuario.length) {
      return res.json({ success: false, message: 'Credenciales incorrectas' })
    }
    
    const user = usuario[0]
    
    // 2. CRÍTICO: Obtener portafolios del usuario
    const portafolios = await db.query(
      'SELECT porcod FROM adm_usr_por WHERE adm_usrid = ?',
      [user.adm_usrid]
    )
    
    // 3. Extraer array de IDs
    const porcodList = portafolios.map(p => p.porcod)
    
    // 4. Agregar al usuario
    user.portafolios = porcodList  // ← [1, 2, 3]
    
    // 5. Generar JWT
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '24h' })
    
    // 6. Devolver completo
    return res.json({
      success: true,
      user: { ...user, token },
      accessToken: token
    })
  } catch (error) {
    console.error(error)
    res.json({ success: false })
  }
}
```

### **Frontend: `Frontend/src/contexts/UserContext.tsx`**

Debe simplemente guardar el usuario:

```typescript
const login = (userData: any) => {
  // userData.portafolios viene del backend
  setUser(userData)
  // localStorage lo guarda automáticamente en useEffect
}
```

### **Frontend: `Frontend/src/components/AppSidebar.tsx`**

Lee los portafolios del user:

```typescript
const { user } = useUser()
const portafoliosPermitidos: number[] = user?.portafolios || []

// Y luego carga los módulos para cada portafolio permitido
for (const porcod of portafoliosPermitidos) {
  const modules = await getModulesByPortfolio(porcod, user.token)
  portfolioMap[porcod] = { modules }
}
```

---

## ❌ Problemas Comunes

### **Problema 1: "Cargando portafolios..." nunca termina**

**Causa**: `user.portafolios` es undefined

**Solución**: Verificar que Backend incluya portafolios en response de login

```bash
curl -X POST http://localhost:3002/api/login \
  -H "Content-Type: application/json" \
  -d '{"usrcod":"stiven","usrpsw":"password123"}'

# Debe incluir en response:
# "portafolios": [1, 2, 3]
```

### **Problema 2: Se ven portafolios vacíos (sin módulos)**

**Causa**: Módulos no se cargan del backend

**Solución**: Verificar `getModulesByPortfolio` en `novModulesApi.ts`

```typescript
// Debe hacer fetch a backend con el portafolio ID
const modules = await fetch(`/api/modules/portfolio/${porcod}`, {
  headers: { Authorization: `Bearer ${token}` }
})
```

### **Problema 3: Cambios de hoy rompieron portafolios**

**Causa**: Se modificó UserContext sin preservar portafolios

**Solución**: 
1. Asegurarse de que `login(userData)` reciba el usuario con portafolios
2. No transformar ni normalizar el userData
3. Guardar exactamente lo que viene del backend

---

## 📊 Vista de Base de Datos

```sql
-- Verificar que usuario tiene portafolios
SELECT a.adm_usrid, a.usrcod, a.usrnom, b.porcod, c.prddes
FROM adm_usr a
LEFT JOIN adm_usr_por b ON a.adm_usrid = b.adm_usrid
LEFT JOIN adm_por c ON b.porcod = c.porcod
WHERE a.usrcod = 'stiven';

-- Resultado esperado:
-- adm_usrid | usrcod  | usrnom | porcod | prddes
-- 5        | stiven  | Stiven | 1      | Cartera
-- 5        | stiven  | Stiven | 2      | Financiero
-- 5        | stiven  | Stiven | 3      | Nomina
```

---

## 🎯 Resumen Rápido

✅ **Backend** → Incluir `portafolios` array en login response

✅ **Frontend UserContext** → Guardar usuario exactamente como viene

✅ **Frontend AppSidebar** → Leer `user.portafolios` y cargar módulos

✅ **localStorage** → Se guarda automáticamente con el usuario

---

**Versión**: 1.0.0  
**Fecha**: 2025-12-10  
**Estado**: ✅ Funcional
