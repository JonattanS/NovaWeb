
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ReportesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          Reportes avanzados y análisis de cuentas por cobrar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Esta sección incluirá reportes detallados y herramientas de análisis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aquí podrás generar reportes personalizados, análisis de cartera 
            y exportaciones avanzadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportesPage;
