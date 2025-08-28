
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockClientes, mockDocumentos } from '@/data/mockData';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { ArrowLeft, Download, FileText, Calendar, DollarSign } from 'lucide-react';

export function ClienteDetail() {
  const { nit } = useParams<{ nit: string }>();
  const navigate = useNavigate();
  
  const cliente = mockClientes.find(c => c.ter_nit === nit);
  const documentos = mockDocumentos[nit || ''] || [];

  if (!cliente) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Cliente no encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleExportDocuments = () => {
    const csvContent = [
      ['Clase', 'Número', 'Fecha', 'Cuenta', 'Nombre Cuenta', 'Valor', 'Observaciones'].join(','),
      ...documentos.map(doc => 
        [doc.clc_cod, doc.doc_num, doc.doc_fec, doc.cta_cod, doc.cta_nom, doc.mov_val, doc.mov_obs].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentos-${cliente.ter_nit}.csv`;
    a.click();
  };

  const getClaseDocumentoBadge = (clc_cod: string) => {
    const variants = {
      'FAC': 'default',
      'NDC': 'secondary',
      'REC': 'outline',
      'CXC': 'destructive'
    } as const;
    
    return variants[clc_cod as keyof typeof variants] || 'default';
  };

  const getClaseDocumentoLabel = (clc_cod: string) => {
    const labels = {
      'FAC': 'Factura',
      'NDC': 'Nota Débito',
      'REC': 'Recibo',
      'CXC': 'Cuenta por Cobrar'
    };
    
    return labels[clc_cod as keyof typeof labels] || clc_cod;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Clientes
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{cliente.ter_raz}</h1>
            <p className="text-muted-foreground">NIT: {cliente.ter_nit}</p>
          </div>
        </div>
        <Button onClick={handleExportDocuments} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Documentos
        </Button>
      </div>

      {/* Resumen del cliente */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cliente.tot_val)}</div>
            <p className="text-xs text-muted-foreground">
              Total pendiente por cobrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentos.length}</div>
            <p className="text-xs text-muted-foreground">
              Documentos pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documento Más Antiguo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentos.length > 0 
                ? formatDate(Math.min(...documentos.map(d => new Date(d.doc_fec).getTime())).toString())
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Fecha más antigua
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de documentos */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos por Cobrar</CardTitle>
          <CardDescription>
            Detalle de todos los documentos pendientes de cobro para este cliente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay documentos pendientes para este cliente
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clase</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cuenta</TableHead>
                  <TableHead>Nombre Cuenta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((documento, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant={getClaseDocumentoBadge(documento.clc_cod)}>
                        {getClaseDocumentoLabel(documento.clc_cod)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{documento.doc_num}</TableCell>
                    <TableCell>{formatDate(documento.doc_fec)}</TableCell>
                    <TableCell className="font-mono text-sm">{documento.cta_cod}</TableCell>
                    <TableCell>{documento.cta_nom}</TableCell>
                    <TableCell className="text-right font-mono">
                      <span className="text-green-600 font-medium">
                        {formatCurrency(documento.mov_val)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={documento.mov_obs}>
                      {documento.mov_obs}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
