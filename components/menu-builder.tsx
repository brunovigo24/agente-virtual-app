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
import { motion } from "framer-motion"

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
          className={`flex items-center p-2 rounded-md hover:bg-blue-900/20 transition-colors ${depth > 0 ? "ml-6" : ""}`}
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(item.id)} className="mr-1 p-1 rounded-md hover:bg-blue-900/30">
              {item.expanded ? <ChevronDown className="h-4 w-4 text-blue-200" /> : <ChevronRight className="h-4 w-4 text-blue-200" />}
            </button>
          ) : (
            <div className="w-6"></div>
          )}

          <span className="flex-1 font-medium text-blue-100">{item.title}</span>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="text-blue-200 hover:text-white hover:bg-white/10">
              <Edit className="h-4 w-4" />
            </Button>

            {item.type === "menu" && (
              <Button variant="ghost" size="icon" onClick={() => addNewItem(item.id)} className="text-blue-200 hover:text-white hover:bg-white/10">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {hasChildren && item.expanded && (
          <div className="menu-children border-l-2 border-blue-900/30 ml-3 pl-2">
            {item.children!.map((child) => renderMenuItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="menu-builder bg-gradient-to-br from-slate-900/80 to-blue-900/60 min-h-screen p-4">
      <motion.div
        className="flex justify-between items-center mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-lg font-medium text-white">Builder de Menu</h3>
        <Button
          onClick={() => addNewItem()}
          className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Item
        </Button>
      </motion.div>

      <Card className="backdrop-blur-sm bg-white/5 border-white/10 shadow-xl text-white">
        <CardContent className="p-4">
          <div className="menu-tree">{menuItems.map((item) => renderMenuItem(item))}</div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white/90 border-white/10 text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-blue-100">Editar Item de Menu</DialogTitle>
            <DialogDescription className="text-blue-200">Configure as propriedades deste item de menu.</DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-blue-200">Título</Label>
                <Input
                  id="title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type" className="text-blue-200">Tipo</Label>
                <Select
                  value={editingItem.type}
                  onValueChange={(value: any) => setEditingItem({ ...editingItem, type: value })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-blue-100">
                    <SelectItem value="menu">Menu</SelectItem>
                    <SelectItem value="action">Ação</SelectItem>
                    <SelectItem value="data_collection">Coleta de Dados</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {editingItem.type === "transfer" && (
                <div className="grid gap-2">
                  <Label htmlFor="destination" className="text-blue-200">Destino</Label>
                  <Select
                    value={editingItem.destination}
                    onValueChange={(value) => setEditingItem({ ...editingItem, destination: value })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Selecione o destino" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 text-blue-100">
                      <SelectItem value="coordenacao">Coordenação</SelectItem>
                      <SelectItem value="matriculas">Matrículas</SelectItem>
                      <SelectItem value="rh">RH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-blue-200">Descrição</Label>
                <Input
                  id="description"
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveItem}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
