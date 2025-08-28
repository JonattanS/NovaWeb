
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dashboard } from '@/components/Dashboard';
import { ClientesList } from '@/components/ClientesList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CuentasPorCobrarModule } from '@/components/query-manual/CuentasPorCobrarModule';

const CuentasPorCobrarPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas por Cobrar</h1>
          <p className="text-muted-foreground">
            Gestión completa de clientes y documentos por cobrar
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="modulo">Configuración del Módulo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <Dashboard />
        </TabsContent>
        
        <TabsContent value="clientes" className="space-y-4">
          <ClientesList />
        </TabsContent>
        
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos los Documentos</CardTitle>
              <CardDescription>
                Vista consolidada de todos los documentos por cobrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta vista mostrará todos los documentos consolidados con filtros avanzados.
                Por ahora puedes ver los documentos desde la vista de cada cliente individual.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modulo" className="space-y-4">
          <div className="max-w-4xl mx-auto">
            <CuentasPorCobrarModule />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CuentasPorCobrarPage;
