
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Receipt, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { moduleService } from '@/services/moduleService';

export const CuentasPorCobrarModule = () => {
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkAndRegisterModule = () => {
      // Configuración del módulo como función principal
      const moduleConfig = {
        name: 'Cuentas por Cobrar - Gestión Integral',
        description: 'Gestión completa de clientes y documentos por cobrar. Incluye análisis de cartera, seguimiento de pagos y reportes detallados.',
        query: `SELECT 
          ter_nit as "NIT/CC",
          ter_raz as "Cliente",
          doc_fec as "Fecha",
          doc_num as "Documento",
          mov_val as "Valor",
          clc_cod as "Código"
        FROM public.con_his 
        WHERE anf_cla = 1 AND anf_cre = 1 
        ORDER BY doc_fec DESC`,
        filters: {},
        folderId: 'default-folder',
        isMainFunction: true,
        dashboardConfig: {
          charts: [
            {
              id: 'saldos-por-cliente',
              type: 'bar',
              title: 'Top 10 Clientes por Saldo',
              dataKey: 'Valor',
              xAxisKey: 'Cliente'
            },
            {
              id: 'evolucion-cartera',
              type: 'line',
              title: 'Evolución de Cartera',
              dataKey: 'Valor',
              xAxisKey: 'Fecha'
            }
          ],
          kpis: [
            {
              id: 'total-cartera',
              title: 'Total Cartera',
              field: 'Valor',
              operation: 'sum',
              format: 'currency'
            },
            {
              id: 'total-clientes',
              title: 'Total Clientes',
              field: 'Cliente',
              operation: 'count_distinct'
            }
          ]
        },
        dynamicFilters: [
          { columnName: 'Cliente', enabled: true },
          { columnName: 'Fecha', enabled: true },
          { columnName: 'NIT/CC', enabled: true },
          { columnName: 'Código', enabled: true }
        ]
      };

      // Verificar si ya existe un módulo con este nombre
      const existingModules = moduleService.getAllModules();
      const moduleExists = existingModules.some(m => m.name === moduleConfig.name);
      
      if (!moduleExists) {
        console.log('Registrando módulo Cuentas por Cobrar - Gestión Integral como función principal');
        try {
          const savedModule = moduleService.saveModule(moduleConfig);
          console.log('Módulo registrado exitosamente:', savedModule);
          setIsRegistered(true);
        } catch (error) {
          console.error('Error al registrar el módulo:', error);
          setIsRegistered(false);
        }
      } else {
        console.log('El módulo ya existe en el repositorio');
        setIsRegistered(true);
      }
    };

    // Ejecutar el registro del módulo
    checkAndRegisterModule();
  }, []);

  const handleNavigate = () => {
    navigate('/cuentas-por-cobrar');
  };

  const features = [
    {
      icon: Users,
      title: 'Gestión de Clientes',
      description: 'Administra la información completa de tus clientes'
    },
    {
      icon: FileText,
      title: 'Control de Documentos',
      description: 'Seguimiento detallado de facturas y documentos por cobrar'
    },
    {
      icon: TrendingUp,
      title: 'Analytics de Cartera',
      description: 'Dashboard con métricas clave y análisis de tendencias'
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>Cuentas por Cobrar</span>
                <Badge variant="outline" className="text-xs">
                  Función Principal
                </Badge>
              </CardTitle>
              <CardDescription>
                Sistema integral para la gestión de cartera y cobranzas
              </CardDescription>
            </div>
          </div>
          {isRegistered && (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              Registrado
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className="p-2 bg-white dark:bg-slate-700 rounded-md">
                <feature.icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <Button onClick={handleNavigate} className="w-full" size="lg">
            <span>Abrir Cuentas por Cobrar</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {isRegistered && (
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Este módulo está disponible en el repositorio de funciones principales
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
