import { BACKEND_URL } from '../config';

export async function saveUserModule(data: any, token: string) {
  const response = await fetch(`${BACKEND_URL}/api/usr-modules`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) throw new Error(`Error al guardar módulo (${response.status})`);
  const result = await response.json();
  return result.module;
}

export async function getUserModules(token: string, userId?: number) {
  let url = `${BACKEND_URL}/api/usr-modules`;
  if (userId) {
    url += `?user_id=${userId}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error al obtener los módulos');
  const result = await response.json();

  // Normalizar datos de snake_case (backend) a camelCase (frontend)
  return result.modules.map((m: any) => ({
    ...m,
    dashboardConfig: m.dashboard_config || { charts: [], kpis: [] },
    dynamicFilters: m.dynamic_filters || [],
    isMainFunction: m.is_main_function
  }));
}

export async function deleteUserModule(id: number, token: string) {
  const response = await fetch(`${BACKEND_URL}/api/usr-modules/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Error al eliminar módulo');
}
