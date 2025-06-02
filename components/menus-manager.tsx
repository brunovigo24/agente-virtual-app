"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { useFetchWithAuth } from "@/lib/fetchWithAuth";

type MenuItem = {
  id: string;
  titulo: string;
  descricao: string;
  opcoes: Array<{ id: string; titulo: string }>;
  ativo?: boolean;
};

export default function MenusManager() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWithAuth = useFetchWithAuth();

  // Função utilitária para requisições autenticadas
  function getAuthHeaders() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth("http://localhost:3000/api/menus", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response) return;
      const data = await response.json();
      const menusArray = Object.entries(data).map(
        ([id, menu]: [string, any]) => ({
          id,
          ...menu,
        })
      );
      setMenus(menusArray);
    } catch (err) {
      setError(
        "Não foi possível carregar os menus. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setIsDialogOpen(true);
    setSaveSuccess(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingMenu({
      id: "",
      titulo: "",
      descricao: "",
      opcoes: [
        { id: "1", titulo: "" },
        { id: "0", titulo: "Voltar ao menu principal" },
      ],
    });
    setIsDialogOpen(true);
    setSaveSuccess(null);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingMenu) return;
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const response = await fetchWithAuth(
        isCreating
          ? "http://localhost:3000/api/menus"
          : `http://localhost:3000/api/menus/${editingMenu.id}`,
        {
          method: isCreating ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            titulo: editingMenu.titulo,
            descricao: editingMenu.descricao,
            opcoes: editingMenu.opcoes,
          }),
        }
      );
      if (!response) return;
      if (isCreating) {
        toast({
          title: "Menu criado",
          description: `O menu "${editingMenu.titulo}" foi criado com sucesso.`,
        });
      } else {
        toast({
          title: "Menu atualizado",
          description: `O menu "${editingMenu.titulo}" foi atualizado com sucesso.`,
        });
      }
      setSaveSuccess(true);
      await fetchMenus();
      setTimeout(() => {
        setIsDialogOpen(false);
        setEditingMenu(null);
      }, 1000);
    } catch (err) {
      setSaveSuccess(false);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o menu.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-100">Carregando menus...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        variant="destructive"
        className="bg-red-500/20 border border-red-500/50 text-red-200"
      >
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Menus</h2>
          <p className="text-blue-200">
            Gerencie os menus de opções que serão apresentados aos usuários.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchMenus}
            variant="outline"
            className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Menu
          </Button>
        </div>
      </div>
      <div className="mb-4 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200" />
        <Input
          type="text"
          placeholder="Pesquisar por nome ou ID..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-blue-200 hover:text-white focus:outline-none"
            aria-label="Limpar pesquisa"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Card className="shadow-xl backdrop-blur-sm bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="text-blue-100">Lista de Menus</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-blue-200">Nome</TableHead>
                <TableHead className="text-blue-200">ID</TableHead>
                <TableHead className="text-right text-blue-200">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus
                .filter((menu) => {
                  const term = searchTerm.trim().toLowerCase();
                  if (!term) return true;
                  return (
                    menu.titulo.toLowerCase().includes(term) ||
                    menu.id.toLowerCase().includes(term)
                  );
                })
                .map((menu) => (
                  <TableRow
                    key={menu.id}
                    className="hover:bg-blue-900/20 transition-colors"
                  >
                    <TableCell className="font-medium text-blue-100">
                      {menu.titulo}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 border-blue-500/30 text-blue-200"
                      >
                        {menu.id}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(menu)}
                          className="text-blue-200 hover:text-white hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-blue-100">
              {isCreating ? "Criar Novo Menu" : "Editar Menu"}
            </DialogTitle>
            <DialogDescription className="text-blue-200">
              {isCreating
                ? "Preencha os campos abaixo para criar um novo menu."
                : `Edite as informações do menu "${editingMenu?.titulo}".`}
            </DialogDescription>
          </DialogHeader>
          {editingMenu && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="titulo" className="text-blue-200">
                  Título do Menu
                </Label>
                <Input
                  id="titulo"
                  value={editingMenu.titulo}
                  onChange={(e) =>
                    setEditingMenu({ ...editingMenu, titulo: e.target.value })
                  }
                  placeholder="Ex: Menu Principal"
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao" className="text-blue-200">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  rows={5}
                  value={editingMenu.descricao}
                  onChange={(e) =>
                    setEditingMenu({
                      ...editingMenu,
                      descricao: e.target.value,
                    })
                  }
                  placeholder="Escolha uma das opções abaixo:&#10;📝 Matrículas&#10;📘 Coordenação"
                  className="font-mono bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                />
                <p className="text-xs text-blue-300">
                  Você pode incluir emojis para ilustrar as opções.
                </p>
              </div>
              <div className="grid gap-2">
                <Label className="text-blue-200">Opções do Menu</Label>
                {editingMenu.opcoes.map((opcao, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="w-16">
                      <Label htmlFor={`opcao-id-${index}`} className="sr-only">
                        ID da Opção
                      </Label>
                      <Input
                        id={`opcao-id-${index}`}
                        value={opcao.id}
                        onChange={(e) => {
                          const newOpcoes = [...editingMenu.opcoes];
                          newOpcoes[index] = {
                            ...newOpcoes[index],
                            id: e.target.value,
                          };
                          setEditingMenu({ ...editingMenu, opcoes: newOpcoes });
                        }}
                        placeholder="ID"
                        className="text-center bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor={`opcao-titulo-${index}`}
                        className="sr-only"
                      >
                        Título da Opção
                      </Label>
                      <Input
                        id={`opcao-titulo-${index}`}
                        value={opcao.titulo}
                        onChange={(e) => {
                          const newOpcoes = [...editingMenu.opcoes];
                          newOpcoes[index] = {
                            ...newOpcoes[index],
                            titulo: e.target.value,
                          };
                          setEditingMenu({ ...editingMenu, opcoes: newOpcoes });
                        }}
                        placeholder="Título da opção"
                        className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                      />
                    </div>
                    {index !== editingMenu.opcoes.length - 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-white/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/10 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription className="text-white-200">
                              Tem certeza que deseja excluir a opção <span className="font-bold text-red-300">{opcao.titulo || 'Sem título'}</span>?<br />
                              <span className="text-red-400 font-semibold">Esta ação não poderá ser desfeita.</span>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
                            >
                              Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                const newOpcoes = [...editingMenu.opcoes];
                                newOpcoes.splice(index, 1);
                                setEditingMenu({ ...editingMenu, opcoes: newOpcoes });
                              }}
                              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
                              >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    const ids = editingMenu.opcoes
                      .map((o) => Number.parseInt(o.id))
                      .filter((id) => !isNaN(id));
                    const maxId = Math.max(...ids, 0);
                    const nextId = (maxId + 1).toString();
                    const newOpcoes = [...editingMenu.opcoes];
                    newOpcoes.splice(newOpcoes.length - 1, 0, {
                      id: nextId,
                      titulo: "",
                    });
                    setEditingMenu({ ...editingMenu, opcoes: newOpcoes });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
              <div className="bg-blue-900/20 p-3 rounded-md">
                <Label className="mb-2 block text-blue-200">
                  Pré-visualização:
                </Label>
                <div className="whitespace-pre-wrap text-sm text-blue-100">
                  {editingMenu.descricao}
                </div>
                <div className="mt-2">
                  {editingMenu.opcoes.map((opcao, index) => (
                    <div key={index} className="text-sm text-blue-100">
                      {opcao.id}: {opcao.titulo}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : saveSuccess === true ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Salvo!
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isCreating ? "Criar Menu" : "Salvar Alterações"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
