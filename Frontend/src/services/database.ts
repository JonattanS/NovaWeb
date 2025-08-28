import { BACKEND_URL } from '../config';

interface ConMovRecord {
  id: number;
  ter_nit: string;
  ter_raz: string;
  clc_cod: string;
  doc_num: number;
  doc_fec: string;
  cta_cod: string;
  cta_nom: string;
  mov_val: number;
  mov_val_ext: number;
  mov_obs: string;
  mov_det: string;
}

interface SavedModule {
  id: string;
  name: string;
  description: string;
  query: string;
  filters: any;
  createdAt: string;
  lastUsed: string;
}

class DatabaseService {
  // Ejecutar un query SQL personalizado (via backend)
  async executeCustomQuery(sql: string): Promise<any[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/execute-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ query: sql }),
      });
      if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const result = await response.json();
      return result.rows || [];
    } catch (error) {
      console.error('Error conectando con backend:', error);
      throw new Error('No se pudo conectar con el backend de base de datos. Verifica que el backend esté en línea.');
    }
  }

  async consultaDocumentos(filtros: any): Promise<any[]> {
    const response = await fetch(`${BACKEND_URL}/api/consultadocumentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(filtros),
    });
    if (!response.ok) throw new Error('Error consultando documentos');
    return await response.json();
  }

  // Gestión de módulos guardados desde el localStorage del navegador
  getSavedModules(): SavedModule[] {
    const saved = localStorage.getItem('saved_modules');
    return saved ? JSON.parse(saved) : [];
  }

  saveModule(module: Omit<SavedModule, 'id' | 'createdAt' | 'lastUsed'>): string {
    const modules = this.getSavedModules();
    const newModule: SavedModule = {
      ...module,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };
    modules.push(newModule);
    localStorage.setItem('saved_modules', JSON.stringify(modules));
    return newModule.id;
  }

  updateModuleLastUsed(moduleId: string) {
    const modules = this.getSavedModules();
    const idx = modules.findIndex(m => m.id === moduleId);
    if (idx !== -1) {
      modules[idx].lastUsed = new Date().toISOString();
      localStorage.setItem('saved_modules', JSON.stringify(modules));
    }
  }

  deleteModule(moduleId: string) {
    const modules = this.getSavedModules();
    const filtered = modules.filter(m => m.id !== moduleId);
    localStorage.setItem('saved_modules', JSON.stringify(filtered));
  }

  getModule(moduleId: string): SavedModule | null {
    const modules = this.getSavedModules();
    return modules.find(m => m.id === moduleId) || null;
  }
}

export const databaseService = new DatabaseService();
export type { ConMovRecord, SavedModule };
