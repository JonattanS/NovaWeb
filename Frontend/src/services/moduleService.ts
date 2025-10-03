export interface PersistentModule {
  id: string;
  porcod?: number;
  name: string;
  description: string;
  query: string;
  filters: any;
  folderId: string;
  createdAt: string;
  lastUsed?: string;
  usageCount?: number;
  isMainFunction?: boolean;
  dashboardConfig?: {
    charts: any[];
    kpis: any[];
  };
  dynamicFilters?: Array<{
    columnName: string;
    enabled: boolean;
  }>;
}

export interface ModuleFolder {
  id: string;
  name: string;
  createdAt: string;
  parentId?: string;
  isMainFunction?: boolean;
  porcod?: number; // Añadido para relacionar folders con portafolios
}

const PORTFOLIOS = [
  { id: '1', name: 'Portafolio financiero', porcod: 1 },
  { id: '2', name: 'Portafolio de Nómina', porcod: 2 },
  { id: '3', name: 'Portafolio de Inventarios', porcod: 3 },
  { id: '9', name: 'Portafolio de Activos Fijos', porcod: 9 },
  { id: '10', name: 'Portafolio de Compras', porcod: 10 },
  { id: '11', name: 'Portafolio Comercial', porcod: 11 },
  { id: '26', name: 'Gestión de Bienes y Servicios', porcod: 26 },
];

// Ajuste de fechas en formato ISO válido
const DEFAULT_FOLDERS: ModuleFolder[] = PORTFOLIOS.map(p => ({
  id: p.id,
  name: p.name,
  createdAt: '2025-07-17T00:00:00.000Z',
  porcod: p.porcod
}));

// Modifica o añade tus módulos existentes para incluir folderId y opcionalmente porcod
const PERSISTENT_MODULES: PersistentModule[] = [
  //{
  //  id: 'cuentas-cobrar-detallado',
  //  porcod: 1,
  //  name: 'Cuentas por Cobrar Detallado',
  //  description: 'Consulta detallada de cuentas por cobrar con filtros avanzados',
  //  query: `SELECT 
  //    ter_nit,
  //    ter_raz,
  //    doc_fec,
  //    doc_num,
  //    mov_val,
  //    clc_cod
  //  FROM public.con_his 
  //  WHERE anf_cla = 1 AND anf_cre = 1 
  //  ORDER BY doc_fec DESC`,
  //  filters: {},
  //  folderId: '1',
  //  createdAt: '2025-01-07T00:00:00.000Z',
  //  lastUsed: '2025-01-07T00:00:00.000Z',
  //  usageCount: 5,
  //  isMainFunction: true
  //},
  //{
  //  id: 'resumen-terceros',
  //  porcod: 1,
  //  name: 'Resumen por Terceros',
  //  description: 'Agrupación de saldos por tercero',
  //  query: `SELECT
  //    ter_nit,
  //    ter_raz,
  //    SUM(mov_val) AS saldo_total,
  //    COUNT(*) AS num_documentos
  //  FROM public.con_his
  //  WHERE anf_cla = 1 AND anf_cre = 1
  //  GROUP BY ter_nit, ter_raz
  //  HAVING SUM(mov_val) > 0
  //  ORDER BY saldo_total DESC`,
  //  filters: {},
  //  folderId: '1',
  //  createdAt: '2025-01-07T00:00:00.000Z',
  //  lastUsed: '2025-01-07T00:00:00.000Z',
  //  usageCount: 3,
  //  isMainFunction: true
  //}
];

class ModuleService {
  private modules: PersistentModule[] = [...PERSISTENT_MODULES];
  private folders: ModuleFolder[] = [...DEFAULT_FOLDERS];

  getAllModules(): PersistentModule[] {
    return this.modules;
  }

  getModuleById(id: string): PersistentModule | undefined {
    return this.modules.find(m => m.id === id);
  }

  saveModule(module: Omit<PersistentModule, 'id' | 'createdAt' | 'lastUsed' | 'usageCount'>): PersistentModule {
    const newModule: PersistentModule = {
      ...module,
      id: `module-${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      usageCount: 0,
      folderId: module.folderId || '1'  // Asigna carpeta por defecto si no se pasa
    };
    
    this.modules.push(newModule);
    return newModule;
  }

  updateModuleLastUsed(id: string): void {
    const module = this.modules.find(m => m.id === id);
    if (module) {
      module.lastUsed = new Date().toISOString();
      module.usageCount = (module.usageCount || 0) + 1;
    }
  }

  promoteToMainFunction(id: string, folderId?: string): boolean {
    const module = this.modules.find(m => m.id === id);
    if (module) {
      module.isMainFunction = true;
      if (folderId) {
        module.folderId = folderId;
      }
      return true;
    }
    return false;
  }

  getMainFunctions(): PersistentModule[] {
    return this.modules.filter(m => m.isMainFunction);
  }

  getMostUsedFunctions(limit: number = 6): PersistentModule[] {
    return this.modules
      .filter(m => m.isMainFunction)
      .sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))
      .slice(0, limit);
  }

  deleteModule(id: string): boolean {
    const index = this.modules.findIndex(m => m.id === id);
    if (index !== -1) {
      this.modules.splice(index, 1);
      return true;
    }
    return false;
  }

  updateDashboardConfig(id: string, dashboardConfig: PersistentModule['dashboardConfig']): boolean {
    const module = this.modules.find(m => m.id === id);
    if (module) {
      module.dashboardConfig = dashboardConfig;
      return true;
    }
    return false;
  }

  // Carpetas / Portafolios management
  getAllFolders(): ModuleFolder[] {
    return this.folders;
  }

  createFolder(name: string, porcod?: number, parentId?: string): ModuleFolder {
    const newFolder: ModuleFolder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      porcod,
      parentId
    };
    
    this.folders.push(newFolder);
    return newFolder;
  }

  deleteFolder(id: string): boolean {
    const index = this.folders.findIndex(f => f.id === id);
    if (index !== -1) {
      // Mover módulos afectados a carpeta default antes de eliminar
      this.modules.forEach(module => {
        if (module.folderId === id) {
          module.folderId = '1';  // Default folder id
        }
      });
      this.folders.splice(index, 1);
      return true;
    }
    return false;
  }

  getModulesByFolder(folderId: string): PersistentModule[] {
    return this.modules.filter(m => m.folderId === folderId);
  }

  moveModule(moduleId: string, folderId: string): boolean {
    const module = this.modules.find(m => m.id === moduleId);
    if (module) {
      module.folderId = folderId;
      return true;
    }
    return false;
  }
}

export const moduleService = new ModuleService();
