-- Tabla de auditoría para registrar eventos del sistema
-- Creación: 2025-12-09
-- Compatibilidad: PostgreSQL

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

-- Índices para mejorar el rendimiento de búsquedas
CREATE INDEX idx_adm_log_adm_ciaid ON adm_log(adm_ciaid);
CREATE INDEX idx_adm_log_adm_usrId ON adm_log(adm_usrId);
CREATE INDEX idx_adm_log_logTip ON adm_log(logTip);
CREATE INDEX idx_adm_log_logFec ON adm_log(logFec);
CREATE INDEX idx_adm_log_logPro ON adm_log(logPro);

-- Nota: Ejecuta este script en tu base de datos PostgreSQL
-- Asegúrate de que las tablas adm_cia, adm_men y adm_usr ya existan
