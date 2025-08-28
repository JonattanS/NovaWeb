import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Folder,
  Plus,
  Search,
  Zap,
  Database,
  Play,
  Trash2,
  Shield,
  ArrowLeft,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { moduleService, type PersistentModule, type ModuleFolder } from "@/services/moduleService";
import { getUserModules } from '@/services/userModulesApi';
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ModuleRepositoryProps {
  onClose: () => void;
}

export const ModuleRepository = ({ onClose }: ModuleRepositoryProps) => {
  const { user, canCreateMainFunctions, canDeleteMainFunctions } = useUser();
  const portafoliosPermitidos: number[] = user?.portafolios || [];
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [modules, setModules] = useState<PersistentModule[]>([]);
  const [folders, setFolders] = useState<ModuleFolder[]>([]);

  const [selectedPortafolio, setSelectedPortafolio] = useState<ModuleFolder | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [moduleToPromote, setModuleToPromote] = useState<PersistentModule | null>(null);
  const [selectedFolderForPromotion, setSelectedFolderForPromotion] = useState<string>("");

  // Combina módulos evitando duplicados por id
  const mergeModulesWithoutDuplicates = (
    hardcoded: PersistentModule[],
    backend: PersistentModule[]
  ): PersistentModule[] => {
    const backendIds = new Set(backend.map((m) => m.id));
    return [...backend, ...hardcoded.filter((m) => !backendIds.has(m.id))];
  };

  // Carga datos: carpetas y módulos y combina
  const loadData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const allFolders = moduleService.getAllFolders();
      setFolders(allFolders.filter((f) => portafoliosPermitidos.includes(f.porcod ?? -1)));

      const hardcodedModules = moduleService.getAllModules();
      const backendModules = await getUserModules(user.token);

      const combined = mergeModulesWithoutDuplicates(hardcodedModules, backendModules);
      setModules(combined);
    } catch (err) {
      setError("No se pudieron cargar los módulos");
      toast({
        title: "Error",
        description: "No se pudieron cargar los módulos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, portafoliosPermitidos, toast]);

  // Ejecutar carga inicial y cuando cambie usuario
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrado por portafolio y búsqueda
  const filteredModules = selectedPortafolio
    ? modules.filter(
        (m) =>
          m.porcod === selectedPortafolio.porcod &&
          (m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  // Manejo creación de nuevas carpetas
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      moduleService.createFolder(newFolderName.trim());
      setNewFolderName("");
      setShowCreateFolder(false);
      loadData();
      toast({
        title: "Carpeta creada",
        description: `La carpeta "${newFolderName}" se creó correctamente`,
      });
    }
  };

  // Manejo promover módulo a función principal
  const handlePromoteModule = (mod: PersistentModule) => {
    if (!canCreateMainFunctions()) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores pueden crear funciones principales",
        variant: "destructive",
      });
      return;
    }
    setModuleToPromote(mod);
    setSelectedFolderForPromotion(mod.folderId || folders[0]?.id || "");
    setShowPromoteDialog(true);
  };

  const confirmPromoteModule = () => {
    if (!moduleToPromote) return;
    const success = moduleService.promoteToMainFunction(moduleToPromote.id, selectedFolderForPromotion);
    if (success) {
      setShowPromoteDialog(false);
      setModuleToPromote(null);
      loadData();
      toast({
        title: "Función principal creada",
        description: `${moduleToPromote.name} ahora es una función principal`,
      });
      setTimeout(() => {
        navigate(`/dynamic-function/${moduleToPromote.id}`);
      }, 500);
    }
  };

  // Manejo eliminar módulo
  const handleDeleteModule = (moduleId: string) => {
    const mod = modules.find((m) => m.id === moduleId);
    if (mod?.isMainFunction && !canDeleteMainFunctions()) {
      toast({
        title: "Permisos insuficientes",
        description: "Solo los administradores pueden eliminar funciones principales",
        variant: "destructive",
      });
      return;
    }
    moduleService.deleteModule(moduleId);
    loadData();
    toast({
      title: "Módulo eliminado",
      description: "El módulo se eliminó correctamente",
    });
  };

  // Manejo click sobre módulo para navegar a la función o query manual
  const handleModuleClick = (mod: PersistentModule) => {
    moduleService.updateModuleLastUsed(mod.id);
    if (mod.isMainFunction) {
      navigate(`/dynamic-function/${mod.id}`);
    } else {
      navigate("/query-manual", { state: { loadModule: mod } });
    }
  };

  // Renderizado controlador estados
  if (!user) return <div>Debes iniciar sesión</div>;
  if (loading) return <div>Cargando módulos...</div>;
  if (error) return <div>{error}</div>;
  if (modules.length === 0) return <div>No hay módulos guardados para este usuario.</div>;

  // Renderizado principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header visual destacado */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <FolderOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                      {selectedPortafolio ? selectedPortafolio.name : "Portafolios Disponibles"}
                    </h1>
                    <p className="text-blue-100 text-lg">
                      {selectedPortafolio
                        ? `${filteredModules.length} módulos disponibles`
                        : `${folders.length} portafolios para explorar`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-yellow-300" />
                <span className="text-sm font-medium">Gestión Avanzada</span>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white/5"></div>
        </div>

        {!selectedPortafolio ? (
          // Vista Portafolios
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/")}
                className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al inicio
              </Button>
            </div>

            {folders.length ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:bg-white"
                    onClick={() => setSelectedPortafolio(folder)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white group-hover:from-purple-500 group-hover:to-indigo-600 transition-all duration-300">
                          <Folder className="h-8 w-8" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {folder.name}
                          </CardTitle>
                          <p className="text-sm text-slate-500 mt-1">Portafolio de módulos</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Explorar contenido</span>
                        <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center bg-white/50 backdrop-blur-sm border-dashed border-2 border-slate-300">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                    <FolderOpen className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg text-slate-600">No tienes portafolios disponibles.</p>
                  <p className="text-sm text-slate-500">Contacta al administrador para obtener acceso.</p>
                </div>
              </Card>
            )}
          </div>
        ) : (
          // Vista Módulos del portafolio seleccionado
          <div className="space-y-6">
            {/* Barra de herramientas */}
            <div className="flex flex-col sm:flex-row gap-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
              <Button
                variant="outline"
                onClick={() => setSelectedPortafolio(null)}
                className="hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a portafolios
              </Button>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar módulos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/50 border-slate-200 focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Dialog Crear Carpeta */}
              <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Carpeta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Carpeta</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Nombre de la carpeta"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-700">
                        Crear
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Grid de Módulos */}
            {filteredModules.length === 0 ? (
              <Card className="p-12 text-center bg-white/50 backdrop-blur-sm border-dashed border-2 border-slate-300">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto">
                    <Database className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-lg text-slate-600">No hay módulos para este portafolio.</p>
                  <p className="text-sm text-slate-500">Los módulos aparecerán aquí cuando sean creados.</p>
                </div>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredModules.map((mod) => (
                  <Card
                    key={mod.id}
                    className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-3 rounded-xl transition-all duration-300 ${
                            mod.isMainFunction
                              ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white group-hover:from-purple-600 group-hover:to-pink-700"
                              : "bg-gradient-to-br from-emerald-500 to-teal-600 text-white group-hover:from-emerald-600 group-hover:to-teal-700"
                          }`}
                        >
                          {mod.isMainFunction ? <Zap className="h-5 w-5" /> : <Database className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                            {mod.name}
                          </CardTitle>
                          <Badge
                            variant={mod.isMainFunction ? "default" : "secondary"}
                            className={`mt-1 ${
                              mod.isMainFunction
                                ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            } transition-colors`}
                          >
                            {mod.isMainFunction ? "Función Principal" : "Módulo Personal"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardDescription className="text-sm text-slate-600 line-clamp-2">
                        {mod.description || "Sin descripción"}
                      </CardDescription>
                      <div className="space-y-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                        <div className="flex justify-between">
                          <span>Carpeta:</span>
                          <span className="font-medium">{selectedPortafolio.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Usos:</span>
                          <span className="font-medium">{mod.usageCount || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Último uso:</span>
                          <span className="font-medium">
                            {mod.lastUsed ? new Date(mod.lastUsed).toLocaleDateString() : "-"}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                          onClick={() => handleModuleClick(mod)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Ejecutar
                        </Button>
                        {!mod.isMainFunction && canCreateMainFunctions() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromoteModule(mod)}
                            className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all duration-200"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteModule(mod.id)}
                          disabled={mod.isMainFunction && !canDeleteMainFunctions()}
                          className="hover:bg-red-600 transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Dialog para promover módulo */}
            <Dialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Función Principal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    ¿En qué carpeta deseas guardar la función principal "{moduleToPromote?.name}"?
                  </p>
                  <Select value={selectedFolderForPromotion} onValueChange={setSelectedFolderForPromotion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar carpeta" />
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center space-x-2">
                            <Folder className="h-4 w-4" />
                            <span>{folder.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowPromoteDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={confirmPromoteModule} className="bg-purple-600 hover:bg-purple-700">
                      Crear Función Principal
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};
