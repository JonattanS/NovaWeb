import { BACKEND_URL } from '../config';

export interface NovModule {
  id: number;
  adm_ciaid: number;
  adm_menid: number;
  mencod: string;
  mennom: string;
  parameters?: string;
  menord?: number;
  mencodpad?: string;
  id_menu?: number;
  adm_gentfnc?: string;
  porcod: number;
  menniv?: number;
  menter: boolean;
  mensis: boolean;
  estcod: number;
  mencontroler?: string;
  menurl?: string;
  mennov?: string;
}

export interface ModulesByPortfolioResponse {
  success: boolean;
  modules: NovModule[];
  modulesByPortfolio?: { [porcod: number]: NovModule[] };
  portfolio?: number;
  company?: number;
}

export async function getModulesByPortfolio(porcod: number, token: string): Promise<NovModule[]> {
  const response = await fetch(`${BACKEND_URL}/api/nov-modules/by-portfolio/${porcod}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error al obtener módulos del portafolio: ${response.status}`);
  }

  const result: ModulesByPortfolioResponse = await response.json();
  return result.modules;
}

export async function getAllCompanyModules(token: string): Promise<ModulesByPortfolioResponse> {
  const response = await fetch(`${BACKEND_URL}/api/nov-modules/all`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error al obtener todos los módulos: ${response.status}`);
  }

  return await response.json();
}

export async function getModuleById(id: number, token: string): Promise<NovModule> {
  const response = await fetch(`${BACKEND_URL}/api/nov-modules/module/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error al obtener el módulo: ${response.status}`);
  }

  const result = await response.json();
  return result.module;
}
