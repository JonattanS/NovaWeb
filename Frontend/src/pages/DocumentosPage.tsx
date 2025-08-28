
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DocumentosPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
        <p className="text-muted-foreground">
          Vista general de todos los documentos por cobrar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximamente</CardTitle>
          <CardDescription>
            Esta vista mostrará todos los documentos consolidados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Funcionalidad en desarrollo. Por ahora puedes ver los documentos 
            desde la vista de cada cliente individual.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentosPage;
