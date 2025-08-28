
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, FileText, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CuentasPorPagarPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas por Pagar</h1>
          <p className="text-muted-foreground">
            Gestión completa de proveedores y documentos por pagar
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-500 text-white">
                <BarChart3 className="h-6 w-6" />
              </div>
              <CardTitle>Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Resumen ejecutivo de cuentas por pagar, saldos y vencimientos
            </CardDescription>
            <Button className="w-full" disabled>
              Próximamente
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-500 text-white">
                <CreditCard className="h-6 w-6" />
              </div>
              <CardTitle>Proveedores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Lista completa de proveedores con sus saldos pendientes
            </CardDescription>
            <Button className="w-full" disabled>
              Próximamente
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-red-500 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle>Documentos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Detalle de facturas y documentos pendientes de pago
            </CardDescription>
            <Button className="w-full" disabled>
              Próximamente
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades Planificadas</CardTitle>
          <CardDescription>
            La sección de Cuentas por Pagar incluirá las siguientes funciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Dashboard Ejecutivo</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Total por pagar</li>
                <li>• Vencimientos próximos</li>
                <li>• Top proveedores</li>
                <li>• Gráficos de evolución</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Gestión de Documentos</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Filtros avanzados</li>
                <li>• Búsqueda por proveedor</li>
                <li>• Ordenamiento múltiple</li>
                <li>• Exportación de datos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CuentasPorPagarPage;
