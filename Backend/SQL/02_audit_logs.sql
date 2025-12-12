-- ============================================================
-- Tabla de Auditoría/Logs del Sistema
-- ============================================================
-- Tabla para registrar todos los eventos y acciones del sistema
-- Incluye logins, queries, operaciones, etc.

CREATE TABLE IF NOT EXISTS adm_log (
  id SERIAL PRIMARY KEY,
  adm_ciaid INTEGER NOT NULL,
  logTip VARCHAR(50) NOT NULL,        -- Tipo de log: LOGIN_EXITOSO, LOGIN_FALLIDO, QUERY, UPDATE, DELETE, etc
  logPro VARCHAR(100),                -- Proceso: LOGIN, CONSULTA, REPORTE, ACTUALIZACION, etc
  logGru VARCHAR(100),                -- Grupo de la acción
  logSec VARCHAR(100),                -- Sección del sistema
  adm_menId INTEGER,                  -- ID del menú/módulo relacionado
  logOpe VARCHAR(255),                -- Operación realizada (descripción corta)
  logDet TEXT,                        -- Detalles adicionales (puede ser JSON)
  adm_usrId INTEGER NOT NULL,         -- ID del usuario que realizó la acción
  logFec TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Fecha y hora del evento
  CONSTRAINT fk_adm_log_usuario FOREIGN KEY (adm_usrId) REFERENCES adm_usr(id) ON DELETE SET NULL,
  CONSTRAINT fk_adm_log_empresa FOREIGN KEY (adm_ciaid) REFERENCES adm_cia(id) ON DELETE CASCADE
);

-- ============================================================
-- Índices para optimizar búsquedas
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adm_log_logfec ON adm_log(logFec DESC);
CREATE INDEX IF NOT EXISTS idx_adm_log_logtip ON adm_log(logTip);
CREATE INDEX IF NOT EXISTS idx_adm_log_adm_usrid ON adm_log(adm_usrId);
CREATE INDEX IF NOT EXISTS idx_adm_log_adm_ciaid ON adm_log(adm_ciaid);
CREATE INDEX IF NOT EXISTS idx_adm_log_logpro ON adm_log(logPro);
CREATE INDEX IF NOT EXISTS idx_adm_log_composite ON adm_log(adm_ciaid, logFec DESC);

-- ============================================================
-- Datos de prueba (comentados por defecto)
-- ============================================================
-- Descomenta si quieres insertar datos de prueba

/*
INSERT INTO adm_log (
  adm_ciaid,
  logTip,
  logPro,
  logGru,
  logSec,
  logOpe,
  logDet,
  adm_usrId,
  logFec
) VALUES 
  (
    1,
    'LOGIN_EXITOSO',
    'LOGIN',
    'AUTENTICACION',
    'USUARIOS',
    'Login exitoso del usuario',
    '{"ip":"192.168.1.1","navegador":"Chrome"}',
    1,
    CURRENT_TIMESTAMP
  ),
  (
    1,
    'LOGIN_FALLIDO',
    'LOGIN',
    'AUTENTICACION',
    'USUARIOS',
    'Intento de login fallido',
    '{"ip":"192.168.1.100","razon":"Contraseña incorrecta"}',
    2,
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
  ),
  (
    1,
    'CONSULTA',
    'REPORTE',
    'REPORTES',
    'CONSULTAS',
    'Generó reporte de saldos',
    '{"reporte":"ReporteSaldosPorNit","registros":150}',
    1,
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
  );
*/

-- ============================================================
-- Vista de logs recientes (opcional)
-- ============================================================
CREATE OR REPLACE VIEW vw_adm_log_recientes AS
SELECT 
  al.id,
  al.logTip,
  al.logPro,
  al.logOpe,
  al.logFec,
  COALESCE(au.usrcod, 'N/A') as usuario,
  COALESCE(au.usrnom, 'N/A') as usuario_nombre,
  COALESCE(ac.ciaraz, 'N/A') as empresa
FROM adm_log al
LEFT JOIN adm_usr au ON al.adm_usrId = au.id
LEFT JOIN adm_cia ac ON al.adm_ciaid = ac.id
ORDER BY al.logFec DESC
LIMIT 100;

COMMENT ON VIEW vw_adm_log_recientes IS 'Vista de los 100 logs más recientes del sistema';
