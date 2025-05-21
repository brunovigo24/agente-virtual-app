"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Save, Loader2, CheckCircle, AlertCircle, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type MenuItem = {
  id: string
  titulo: string
  descricao: string
  opcoes: Array<{ id: string; titulo: string }>
  ativo?: boolean
}

export default function MenusManager() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Função utilitária para requisições autenticadas
  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:3000/api/menus", {
        headers: {
          ...getAuthHeaders(),
        },
      })
      if (!response.ok) throw new Error("Erro ao buscar menus")
      const data = await response.json()
      const menusArray = Object.entries(data).map(([id, menu]: [string, any]) => ({
        id,
        ...menu,
      }))
      setMenus(menusArray)
    } catch (err) {
      setError("Não foi possível carregar os menus. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu)
    setIsDialogOpen(true)
    setSaveSuccess(null)
    setIsCreating(false)
  }

  const handleCreate = () => {
    setEditingMenu({
      id: "",
      titulo: "",
      descricao: "",
      opcoes: [
        { id: "1", titulo: "" },
        { id: "0", titulo: "Voltar ao menu principal" },
      ],
    })
    setIsDialogOpen(true)
    setSaveSuccess(null)
    setIsCreating(true)
  }

  const handleSave = async () => {
    if (!editingMenu) return
    setIsSaving(true)
    setSaveSuccess(null)
    try {
      const response = await fetch(
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
      )
      if (!response.ok) throw new Error("Erro ao salvar menu")
      if (isCreating) {
        toast({
          title: "Menu criado",
          description: `O menu "${editingMenu.titulo}" foi criado com sucesso.`,
        })
      } else {
        toast({
          title: "Menu atualizado",
          description: `O menu "${editingMenu.titulo}" foi atualizado com sucesso.`,
        })
      }
      setSaveSuccess(true)
      await fetchMenus()
      setTimeout(() => {
        setIsDialogOpen(false)
        setEditingMenu(null)
      }, 1000)
    } catch (err) {
      setSaveSuccess(false)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o menu.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando menus...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="menus-manager">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menus</h2>
          <p className="text-muted-foreground">Gerencie os menus de opções que serão apresentados aos usuários.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchMenus} variant="outline">
            Atualizar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Menu
          </Button>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Lista de Menus</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menus.map((menu) => (
                <TableRow key={menu.id}>
                  <TableCell className="font-medium">{menu.titulo}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{menu.id}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(menu)}>
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
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Criar Novo Menu" : "Editar Menu"}</DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Preencha os campos abaixo para criar um novo menu."
                : `Edite as informações do menu "${editingMenu?.titulo}".`}
            </DialogDescription>
          </DialogHeader>
          {editingMenu && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título do Menu</Label>
                <Input
                  id="titulo"
                  value={editingMenu.titulo}
                  onChange={(e) => setEditingMenu({ ...editingMenu, titulo: e.target.value })}
                  placeholder="Ex: Menu Principal"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  rows={5}
                  value={editingMenu.descricao}
                  onChange={(e) => setEditingMenu({ ...editingMenu, descricao: e.target.value })}
                  placeholder="Escolha uma das opções abaixo:&#10;📝 Matrículas&#10;📘 Coordenação"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use \n para quebras de linha. Você pode incluir emojis para ilustrar as opções.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Opções do Menu</Label>
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
                          const newOpcoes = [...editingMenu.opcoes]
                          newOpcoes[index] = { ...newOpcoes[index], id: e.target.value }
                          setEditingMenu({ ...editingMenu, opcoes: newOpcoes })
                        }}
                        placeholder="ID"
                        className="text-center"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`opcao-titulo-${index}`} className="sr-only">
                        Título da Opção
                      </Label>
                      <Input
                        id={`opcao-titulo-${index}`}
                        value={opcao.titulo}
                        onChange={(e) => {
                          const newOpcoes = [...editingMenu.opcoes]
                          newOpcoes[index] = { ...newOpcoes[index], titulo: e.target.value }
                          setEditingMenu({ ...editingMenu, opcoes: newOpcoes })
                        }}
                        placeholder="Título da opção"
                      />
                    </div>
                    {index !== editingMenu.opcoes.length - 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newOpcoes = [...editingMenu.opcoes]
                          newOpcoes.splice(index, 1)
                          setEditingMenu({ ...editingMenu, opcoes: newOpcoes })
                        }}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    const ids = editingMenu.opcoes.map((o) => Number.parseInt(o.id)).filter((id) => !isNaN(id))
                    const maxId = Math.max(...ids, 0)
                    const nextId = (maxId + 1).toString()
                    const newOpcoes = [...editingMenu.opcoes]
                    newOpcoes.splice(newOpcoes.length - 1, 0, { id: nextId, titulo: "" })
                    setEditingMenu({ ...editingMenu, opcoes: newOpcoes })
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Opção
                </Button>
              </div>
              <div className="bg-muted p-3 rounded-md">
                <Label className="mb-2 block">Pré-visualização:</Label>
                <div className="whitespace-pre-wrap text-sm">{editingMenu.descricao}</div>
                <div className="mt-2">
                  {editingMenu.opcoes.map((opcao, index) => (
                    <div key={index} className="text-sm">
                      {opcao.id}: {opcao.titulo}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
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
  )
}
