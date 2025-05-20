"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Edit, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type MenuItem = {
  id: string
  title: string
  type: "menu" | "action" | "data_collection" | "transfer"
  destination?: string
  description?: string
  children?: MenuItem[]
  expanded?: boolean
}

export default function MenuBuilder() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "matriculas_menu",
      title: "1. Matrículas",
      type: "menu",
      expanded: true,
      children: [
        {
          id: "infantil",
          title: "1. Infantil",
          type: "action",
          description: "Matrículas para ensino infantil",
        },
        {
          id: "ensino_medio",
          title: "2. Ensino Médio",
          type: "data_collection",
          description: "Coleta de dados para ensino médio",
        },
        {
          id: "outros",
          title: "3. Outros",
          type: "transfer",
          destination: "coordenacao",
          description: "Transferir para coordenação",
        },
      ],
    },
    {
      id: "coordenacao_menu",
      title: "2. Coordenação",
      type: "menu",
      expanded: false,
      children: [],
    },
    {
      id: "rh_menu",
      title: "3. RH",
      type: "menu",
      expanded: false,
      children: [],
    },
  ])

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const toggleExpand = (id: string) => {
    setMenuItems((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          return { ...item, expanded: !item.expanded }
        } else if (item.children) {
          return {
            ...item,
            children: item.children.map((child) => {
              if (child.id === id) {
                return { ...child, expanded: !child.expanded }
              }
              return child
            }),
          }
        }
        return item
      })
    })
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem({ ...item })
    setIsDialogOpen(true)
  }

  const saveItem = () => {
    if (!editingItem) return

    setMenuItems((prev) => {
      return prev.map((item) => {
        if (item.id === editingItem.id) {
          return { ...editingItem, children: item.children }
        } else if (item.children) {
          return {
            ...item,
            children: item.children.map((child) => {
              if (child.id === editingItem.id) {
                return editingItem
              }
              return child
            }),
          }
        }
        return item
      })
    })

    setIsDialogOpen(false)
    setEditingItem(null)
  }

  const addNewItem = (parentId?: string) => {
    const newItem: MenuItem = {
      id: `item_${Date.now()}`,
      title: "Novo Item",
      type: "menu",
      children: [],
    }

    if (!parentId) {
      setMenuItems([...menuItems, newItem])
    } else {
      setMenuItems((prev) => {
        return prev.map((item) => {
          if (item.id === parentId) {
            return {
              ...item,
              children: [...(item.children || []), newItem],
              expanded: true,
            }
          }
          return item
        })
      })
    }
  }

  const renderMenuItem = (item: MenuItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.id} className="menu-item">
        <div
          className={`flex items-center p-2 rounded-md hover:bg-muted ${depth > 0 ? "ml-6" : ""}`}
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(item.id)} className="mr-1 p-1 rounded-md hover:bg-muted-foreground/10">
              {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          <span className="flex-1 font-medium">{item.title}</span>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>

            {item.type === "menu" && (
              <Button variant="ghost" size="icon" onClick={() => addNewItem(item.id)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {hasChildren && item.expanded && (
          <div className="menu-children border-l-2 border-muted ml-3 pl-2">
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="menu-builder">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Builder de Menu</h3>
        <Button onClick={() => addNewItem()}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="menu-tree">{menuItems.map((item) => renderMenuItem(item))}</div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item de Menu</DialogTitle>
            <DialogDescription>Configure as propriedades deste item de menu.</DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={editingItem.type}
                  onValueChange={(value: any) => setEditingItem({ ...editingItem, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="menu">Menu</SelectItem>
                    <SelectItem value="action">Ação</SelectItem>
                    <SelectItem value="data_collection">Coleta de Dados</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingItem.type === "transfer" && (
                <div className="grid gap-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Select
                    value={editingItem.destination}
                    onValueChange={(value) => setEditingItem({ ...editingItem, destination: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coordenacao">Coordenação</SelectItem>
                      <SelectItem value="matriculas">Matrículas</SelectItem>
                      <SelectItem value="rh">RH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveItem}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
