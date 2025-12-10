import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { BACKEND_URL } from "../config";

type UserType = {
  token: string;
  usrcod: string;
  adm_rolid: number;
  rolcod: string;
  roldes: string;
  id?: number;
  adm_ciaid?: number;
  portafolios?: number[];
  ciaraz?: string;
  usrnom?: string;
  [key: string]: any;
};

interface UserContextProps {
  user: any;
  login: (userData: any, newRefreshToken?: string) => void;
  logout: (skipAudit?: boolean) => Promise<void>;
  canCreateMainFunctions: () => boolean;
  canDeleteMainFunctions: () => boolean;
  isAdmin: () => boolean;
  refreshAccessToken: () => Promise<boolean>;
  tokenExpiresAt: number | null;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

/**
 * Asegura que el usuario tenga todos los campos requeridos
 */
const normalizeUser = (userData: any): any => {
  if (!userData) return null;
  
  return {
    ...userData,
    portafolios: userData.portafolios || [],
    rolcod: userData.rolcod || null,
    roldes: userData.roldes || null,
    ciaraz: userData.ciaraz || null,
  };
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Recupera usuario del localStorage si existe
    const data = localStorage.getItem("user");
    return data ? normalizeUser(JSON.parse(data)) : null;
  });

  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    return localStorage.getItem("refreshToken");
  });

  const [tokenExpiresAt, setTokenExpiresAt] = useState<number | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Guardar usuario y refresh token en localStorage
  useEffect(() => {
    if (user) {
      const normalizedUser = normalizeUser(user);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }, [refreshToken]);

  // Función para refrescar el token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) {
      console.log('[TOKEN REFRESH] No hay refresh token disponible');
      return false;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.warn('[TOKEN REFRESH] Error al refrescar token');
        return false;
      }

      const data = await response.json();

      if (data.success && data.accessToken) {
        // Actualizar usuario COMPLETO (incluyendo portafolios, roles, etc)
        // Normalizar para asegurar que tenga todos los campos
        if (data.user) {
          const normalizedUser = normalizeUser(data.user);
          setUser(normalizedUser);
          console.log('[TOKEN REFRESH] Usuario actualizado con portafolios:', normalizedUser.portafolios);
        } else {
          // Fallback: solo actualizar token pero mantener portafolios
          const updatedUser = normalizeUser({ ...user, token: data.accessToken });
          setUser(updatedUser);
        }

        // Calcular nueva fecha de expiración (30 minutos desde ahora)
        const expiresAt = Date.now() + (data.expiresIn * 1000);
        setTokenExpiresAt(expiresAt);

        console.log('[TOKEN REFRESH] Token refrescado exitosamente');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[TOKEN REFRESH ERROR]', error);
      return false;
    }
  }, [refreshToken, user]);

  // Función de logout
  const logout = useCallback(
    async (skipAudit: boolean = false) => {
      // Registrar logout en auditoría si es necesario
      if (!skipAudit && user?.id && user?.adm_ciaid) {
        try {
          await fetch(`${BACKEND_URL}/api/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              usrId: user.id,
              adm_ciaid: user.adm_ciaid,
            }),
          });
        } catch (error) {
          console.error('[LOGOUT AUDIT ERROR]', error);
        }
      }

      // Limpiar estado
      setUser(null);
      setRefreshToken(null);
      setTokenExpiresAt(null);

      // Limpiar timers
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      // Redirigir a login usando window.location en lugar de useNavigate
      window.location.href = '/login';
    },
    [user?.id, user?.adm_ciaid]
  );

  // Login
  const login = useCallback(
    (userData: UserType, newRefreshToken?: string) => {
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
      // Token expira en 30 minutos
      setTokenExpiresAt(Date.now() + 30 * 60 * 1000);
      console.log('[LOGIN] Usuario login con portafolios:', normalizedUser.portafolios);
    },
    []
  );

  // Hook para refrescar token antes de que expire
  useEffect(() => {
    if (!user || !refreshToken || !tokenExpiresAt) return;

    // Refrescar token 5 minutos antes de que expire
    const timeUntilExpiry = tokenExpiresAt - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 1000);

    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    refreshTimerRef.current = setTimeout(async () => {
      console.log('[TOKEN AUTO-REFRESH] Refrescando token automáticamente');
      const success = await refreshAccessToken();
      if (!success) {
        console.warn('[TOKEN AUTO-REFRESH] Fallo al refrescar, haz logout');
        await logout(true); // Skip audit porque el token está expirado
      }
    }, refreshTime);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [user, refreshToken, tokenExpiresAt, refreshAccessToken, logout]);

  // Hook para cierre automático por inactividad (30 minutos)
  useEffect(() => {
    if (!user) return;

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      inactivityTimerRef.current = setTimeout(() => {
        console.log('[INACTIVITY LOGOUT] Usuario inactivo por 30 minutos');
        logout();
      }, 30 * 60 * 1000); // 30 minutos
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, logout]);

  // Monitorear token expirado
  useEffect(() => {
    if (!tokenExpiresAt) return;

    const checkTokenExpiry = setInterval(() => {
      if (Date.now() > tokenExpiresAt) {
        console.warn('[TOKEN EXPIRY] Token expirado, redirigiendo a login');
        logout(true);
        clearInterval(checkTokenExpiry);
      }
    }, 5000); // Verificar cada 5 segundos

    return () => clearInterval(checkTokenExpiry);
  }, [tokenExpiresAt, logout]);

  const canCreateMainFunctions = () => user?.rolcod === 'adm';
  const canDeleteMainFunctions = () => user?.rolcod === 'adm';
  const isAdmin = () => user?.rolcod === 'adm';

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        canCreateMainFunctions,
        canDeleteMainFunctions,
        isAdmin,
        refreshAccessToken,
        tokenExpiresAt,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser debe usarse dentro de UserProvider');
  return context;
};
