
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, Download, Save, Code } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/contexts/UserContext';
import { Badge } from '@/components/ui/badge';

interface QueryEditorProps {
  query: string;
  setQuery: (query: string) => void;
  executeQuery: () => void;
  isLoading: boolean;
  error: string;
  onSaveModule: () => void;
  onExportResults?: () => void; 
  hasResults: boolean;
  resultsCount: number;
}

export const QueryEditor = ({
  query,
  setQuery,
  executeQuery,
  isLoading,
  error,
  onSaveModule,
  onExportResults,
  hasResults,
  resultsCount
}: QueryEditorProps) => {
  const { isAdmin } = useUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Code className="h-5 w-5" />
          <span>Editor de SQL Avanzado</span>
          {isAdmin() && <Badge variant="outline">Solo Administrador</Badge>}
        </CardTitle>
        <CardDescription>
          {isAdmin() ? 
            'Escribe SQL personalizado para consultas avanzadas' : 
            'Solo los administradores pueden ver y editar SQL directamente'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin() ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="query">Consulta SQL</Label>
              <Textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="SELECT * FROM public.con_his WHERE..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={executeQuery} disabled={isLoading || !query.trim()}>
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Ejecutando...' : 'Ejecutar Query'}
              </Button>
              
              <Button variant="outline" disabled={!query.trim()} onClick={onSaveModule}>
                <Save className="h-4 w-4 mr-2" />
                Guardar como Módulo
              </Button>
              
              {hasResults && (
                <Button variant="outline" onClick={onExportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Code className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              Acceso Restringido
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
              Solo los administradores pueden acceder al editor SQL directo.
              Usa el Constructor Visual para crear tus consultas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
