# Flujo de Arquitectura NovaWeb

## Backend - Estructura de Rutas

```javascript
// routes/consultadocumentos.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. CONSTRUCCIÓN DINÁMICA DE FILTROS
function construirWhere(filtros) {
  const where = [];
  const values = [];
  let idx = 1;
  
  // Mapeo de filtros a condiciones SQL
  const filtroMap = {
    suc_cod: (val) => `suc_cod = $${idx++}`,
    suc_cod_ini: (val) => `suc_cod >= $${idx++}`,
    suc_cod_fin: (val) => `suc_cod <= $${idx++}`,
    fecha_ini: (val) => `doc_fec >= $${idx++}`,
    fecha_fin: (val) => `doc_fec <= $${idx++}`
  };
  
  Object.entries(filtros).forEach(([key, value]) => {
    if (value && filtroMap[key]) {
      where.push(filtroMap[key](value));
      values.push(value);
    }
  });
  
  return {
    sql: where.length > 0 ? `WHERE ${where.join(' AND ')}` : '',
    values
  };
}

// 2. ENDPOINT PRINCIPAL
router.post('/consultadocumentos', async (req, res) => {
  const { fuente = 'con_his', ...filtros } = req.body;
  
  // Construir WHERE dinámico
  const { sql, values } = construirWhere(filtros);
  
  // Query base según fuente
  const baseQuery = `
    SELECT * FROM ${fuente}
    ${sql}
    ORDER BY clc_cod, doc_num
  `;
  
  try {
    const result = await pool.query(baseQuery, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ 
      error: `Error consultando ${fuente}`, 
      detalle: err.message 
    });
  }
});
```

## Frontend - Servicio API

```javascript
// services/documentosService.js
class DocumentosService {
  constructor() {
    this.baseURL = '/api';
  }
  
  // Consulta documentos con filtros
  async consultarDocumentos(filtros) {
    const response = await fetch(`${this.baseURL}/consultadocumentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filtros)
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    return await response.json();
  }
}

export default new DocumentosService();
```

## Frontend - Componente de Filtros

```javascript
// components/FiltrosDocumentos.js
import React, { useState } from 'react';
import documentosService from '../services/documentosService';

const FiltrosDocumentos = ({ onResultados }) => {
  const [filtros, setFiltros] = useState({
    suc_cod: '',
    fecha_ini: '',
    fecha_fin: '',
    fuente: 'con_his'
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const resultados = await documentosService.consultarDocumentos(filtros);
      onResultados(resultados);
    } catch (error) {
      console.error('Error consultando documentos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Código Sucursal"
        value={filtros.suc_cod}
        onChange={(e) => setFiltros({...filtros, suc_cod: e.target.value})}
      />
      
      <input
        type="date"
        value={filtros.fecha_ini}
        onChange={(e) => setFiltros({...filtros, fecha_ini: e.target.value})}
      />
      
      <input
        type="date"
        value={filtros.fecha_fin}
        onChange={(e) => setFiltros({...filtros, fecha_fin: e.target.value})}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Consultando...' : 'Consultar'}
      </button>
    </form>
  );
};

export default FiltrosDocumentos;
```

## Frontend - Componente Principal

```javascript
// components/ConsultaDocumentos.js
import React, { useState } from 'react';
import FiltrosDocumentos from './FiltrosDocumentos';
import TablaResultados from './TablaResultados';

const ConsultaDocumentos = () => {
  const [resultados, setResultados] = useState([]);
  
  return (
    <div>
      <h1>Consulta de Documentos</h1>
      
      <FiltrosDocumentos onResultados={setResultados} />
      
      <TablaResultados datos={resultados} />
    </div>
  );
};

export default ConsultaDocumentos;
```

## Flujo de Datos Completo

```javascript
// FLUJO PASO A PASO

// 1. Usuario completa filtros en frontend
const filtros = {
  suc_cod: '001',
  fecha_ini: '2024-01-01',
  fecha_fin: '2024-12-31',
  fuente: 'con_his'
};

// 2. Frontend envía POST request
fetch('/api/consultadocumentos', {
  method: 'POST',
  body: JSON.stringify(filtros)
});

// 3. Backend recibe y procesa
router.post('/consultadocumentos', async (req, res) => {
  // Extrae filtros
  const { fuente, ...filtros } = req.body;
  
  // Construye WHERE dinámico
  const { sql, values } = construirWhere(filtros);
  // sql = "WHERE suc_cod = $1 AND doc_fec >= $2 AND doc_fec <= $3"
  // values = ['001', '2024-01-01', '2024-12-31']
  
  // Ejecuta query
  const result = await pool.query(baseQuery, values);
  
  // Retorna JSON
  res.json(result.rows);
});

// 4. Frontend recibe y actualiza UI
const resultados = await response.json();
setResultados(resultados);
```

## Base de Datos - Estructura

```sql
-- Tabla principal con_his
CREATE TABLE con_his (
  id SERIAL PRIMARY KEY,
  suc_cod VARCHAR(10),
  clc_cod VARCHAR(10),
  doc_num INTEGER,
  doc_fec DATE,
  ter_nit VARCHAR(20),
  cta_cod VARCHAR(20),
  -- ... más campos
);

-- Índices para optimizar consultas
CREATE INDEX idx_con_his_suc_cod ON con_his(suc_cod);
CREATE INDEX idx_con_his_fecha ON con_his(doc_fec);
CREATE INDEX idx_con_his_compuesto ON con_his(suc_cod, doc_fec);
```

## Configuración de Conexión

```javascript
// db.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports = pool;
```