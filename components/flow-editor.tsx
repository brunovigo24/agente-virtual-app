"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, RefreshCw, ArrowRight, X, Plus, Download, ZoomIn, ZoomOut, Move } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node as RFNode,
  Edge as RFEdge,
  Position,
} from "reactflow"
import "reactflow/dist/style.css"
import { motion } from "framer-motion"

// Tipos atualizados para o novo formato da API
type MenuOpcao = {
  id: string
  titulo: string
}
type MenuData = {
  titulo: string
  descricao: string
  opcoes: MenuOpcao[]
}
type MenusData = {
  [key: string]: MenuData
}
type EtapaTerminal = string

type FlowNode = {
  id: string
  label: string
  isTerminal: boolean
  x: number
  y: number
  level: number
  column: number
  description?: string
}

type FlowEdge = {
  id: string
  source: string
  target: string
  label?: string
  sourceX?: number
  sourceY?: number
  targetX?: number
  targetY?: number
}

export default function FlowEditor() {
  // Estados
  const [menusData, setMenusData] = useState<MenusData>({})
  const [etapasTerminais, setEtapasTerminais] = useState<EtapaTerminal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [editedMenu, setEditedMenu] = useState<MenuData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showAllNodes, setShowAllNodes] = useState(false)
  const [rfNodes, setRfNodes] = useState<RFNode[]>([])
  const [rfEdges, setRfEdges] = useState<RFEdge[]>([])

  // Função utilitária para requisições autenticadas
  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // Buscar menus da API
  const fetchMenusData = useCallback(async () => {
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
      setMenusData(data)
      // Etapas terminais: menus sem opções ou opção "encerrar_atendimento"
      const terminais = Object.keys(data).filter(
        (k) =>
          !data[k].opcoes ||
          data[k].opcoes.length === 0 ||
          data[k].opcoes.some((o) => o.id === "0" && o.titulo.toLowerCase().includes("encerrar")),
      )
      setEtapasTerminais(terminais)
      processMenusData(data, terminais)
    } catch (err) {
      setError("Não foi possível carregar os menus. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Processar menus para react-flow
  const processMenusData = useCallback(
    (data: MenusData, terminais: EtapaTerminal[]) => {
      // Layout e edges semelhantes ao anterior, mas usando o novo formato
      const newNodes: FlowNode[] = []
      const newEdges: FlowEdge[] = []
      const processedNodes = new Set<string>()
      const currentPath = new Set<string>()
      const nodeLevels: { [key: string]: number } = {}
      const nodeColumns: { [key: string]: number } = {}
      const levelCounts: { [key: number]: number } = {}

      const assignLevels = (nodeId: string, level = 0, visited = new Set<string>()) => {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        if (nodeLevels[nodeId] === undefined || level < nodeLevels[nodeId]) {
          nodeLevels[nodeId] = level
          levelCounts[level] = (levelCounts[level] || 0) + 1
        }
        const menu = data[nodeId]
        if (menu && menu.opcoes) {
          menu.opcoes.forEach((op) => {
            if (data[op.titulo.replace(/ /g, "_").toLowerCase()] || data[op.id]) {
              assignLevels(op.id, level + 1, visited)
            }
          })
        }
      }
      assignLevels("menu_principal")

      Object.keys(nodeLevels).forEach((nodeId) => {
        const level = nodeLevels[nodeId]
        nodeColumns[nodeId] =
          levelCounts[level] > 1
            ? Math.floor(
                Object.keys(nodeColumns).filter((id) => nodeLevels[id] === level).length *
                  (800 / (levelCounts[level] + 1)),
              )
            : 400
      })

      const processNode = (nodeId: string, level: number, parentId?: string, parentOptionId?: string) => {
        if (currentPath.has(nodeId)) {
          if (parentId) addEdge(parentId, nodeId, parentOptionId)
          return
        }
        if (processedNodes.has(nodeId) && !showAllNodes) {
          if (parentId) addEdge(parentId, nodeId, parentOptionId)
          return
        }
        currentPath.add(nodeId)
        const menu = data[nodeId]
        const isTerminal = terminais.includes(nodeId) || !menu?.opcoes || menu.opcoes.length === 0
        const nodeLabel = menu?.titulo || nodeId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
        const x = nodeColumns[nodeId] || 400
        const y = (nodeLevels[nodeId] || 0) * 150 + 100
        if (!processedNodes.has(nodeId)) {
          newNodes.push({
            id: nodeId,
            label: nodeLabel,
            isTerminal,
            x,
            y,
            level: nodeLevels[nodeId] || 0,
            column: nodeColumns[nodeId] || 0,
            description: menu?.descricao,
          })
          processedNodes.add(nodeId)
        }
        if (parentId) addEdge(parentId, nodeId, parentOptionId)
        if (level >= 10) {
          currentPath.delete(nodeId)
          return
        }
        if (!isTerminal && (showAllNodes || level < 2)) {
          menu?.opcoes?.forEach((op) => {
            processNode(op.id, level + 1, nodeId, op.id)
          })
        }
        currentPath.delete(nodeId)
      }

      const addEdge = (sourceId: string, targetId: string, optionId?: string) => {
        const sourceNode = newNodes.find((n) => n.id === sourceId) || {
          x: nodeColumns[sourceId] || 0,
          y: (nodeLevels[sourceId] || 0) * 150 + 100,
        }
        const targetNode = newNodes.find((n) => n.id === targetId) || {
          x: nodeColumns[targetId] || 0,
          y: (nodeLevels[targetId] || 0) * 150 + 100,
        }
        const menu = data[sourceId]
        const op = menu?.opcoes?.find((o) => o.id === optionId)
        const label = op?.titulo ? `${op.id} - ${op.titulo}` : optionId || ""
        const edgeId = `${sourceId}-${targetId}-${optionId || ""}`
        if (!newEdges.some((e) => e.id === edgeId)) {
          newEdges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            label,
            sourceX: sourceNode.x + 100,
            sourceY: sourceNode.y + 25,
            targetX: targetNode.x,
            targetY: targetNode.y + 25,
          })
        }
      }

      processNode("menu_principal", 0)
      setRfNodes(
        newNodes.map((node) => ({
          id: node.id,
          data: {
            label: (
              <div>
                <div className="font-bold">{node.label}</div>
                {node.description && <div className="text-xs text-gray-500">{node.description}</div>}
                {node.isTerminal && (
                  <Badge variant="outline" className="mt-1 text-xs bg-red-50">
                    Terminal
                  </Badge>
                )}
              </div>
            ),
          },
          position: { x: node.x, y: node.y },
          style: {
            width: 200,
            background: node.isTerminal ? "rgba(239,68,68,0.08)" : "rgba(37,99,235,0.08)",
            border: node.isTerminal ? "1px solid #ef4444" : "1px solid #3b82f6",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            borderRadius: 8,
            zIndex: selectedNode === node.id ? 10 : 1,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          className: selectedNode === node.id ? "ring-2 ring-blue-400" : "",
        })),
      )
      setRfEdges(
        newEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: false,
          style: { stroke: "#60a5fa", strokeWidth: 2 },
          labelStyle: { fill: "#93c5fd", fontWeight: 500, fontSize: 12, background: "rgba(0,0,0,0.2)" },
        })),
      )
    },
    [showAllNodes, selectedNode],
  )

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchMenusData()
  }, [fetchMenusData])

  // Efeito para reprocessar dados quando showAllNodes muda
  useEffect(() => {
    if (Object.keys(menusData).length > 0) {
      processMenusData(menusData, etapasTerminais)
    }
  }, [menusData, etapasTerminais, processMenusData, showAllNodes])

  // Selecionar menu para edição
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    setEditedMenu(menusData[nodeId] ? { ...menusData[nodeId], opcoes: [...menusData[nodeId].opcoes] } : null)
  }

  // Manipulador de clique em nó para react-flow
  const onNodeClick = useCallback(
    (_: any, node: RFNode) => {
      handleNodeClick(node.id)
    },
    [handleNodeClick],
  )

  // Salvar alterações
  const handleSave = async () => {
    if (!selectedNode || !editedMenu) return
    setIsSaving(true)
    try {
      const response = await fetch(`http://localhost:3000/api/menus/${selectedNode}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(editedMenu),
      })
      if (!response.ok) throw new Error("Erro ao salvar")
      const updated = await response.json()
      setMenusData((prev) => ({
        ...prev,
        [selectedNode]: updated,
      }))
      processMenusData(
        {
          ...menusData,
          [selectedNode]: updated,
        },
        etapasTerminais,
      )
      toast({
        title: "Menu atualizado",
        description: `O menu "${editedMenu.titulo}" foi atualizado com sucesso.`,
      })
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Atualizar campos do menu
  const handleMenuFieldChange = (field: keyof MenuData, value: string) => {
    if (!editedMenu) return
    setEditedMenu({ ...editedMenu, [field]: value })
  }

  // Atualizar uma opção
  const handleOptionChange = (idx: number, field: keyof MenuOpcao, value: string) => {
    if (!editedMenu) return
    const opcoes = editedMenu.opcoes.map((op, i) =>
      i === idx ? { ...op, [field]: value } : op,
    )
    setEditedMenu({ ...editedMenu, opcoes })
  }

  // Adicionar nova opção
  const handleAddOption = () => {
    if (!editedMenu) return
    setEditedMenu({
      ...editedMenu,
      opcoes: [...editedMenu.opcoes, { id: "", titulo: "" }],
    })
  }

  // Remover opção
  const handleRemoveOption = (idx: number) => {
    if (!editedMenu) return
    setEditedMenu({
      ...editedMenu,
      opcoes: editedMenu.opcoes.filter((_, i) => i !== idx),
    })
  }

  // Exportar menus como JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(menusData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = "menus.json"
    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900/80 to-blue-900/60">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-100">Carregando menus...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/20 border border-red-500/50 text-red-200">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flow-editor bg-gradient-to-br from-slate-900/80 to-blue-900/60 min-h-screen p-4">
      <motion.div
        className="mb-6 flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Editor de Fluxo</h2>
          <p className="text-blue-200">Visualize e edite o fluxo de atendimento do seu sistema.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-all"
              checked={showAllNodes}
              onCheckedChange={setShowAllNodes}
              className="bg-white/20 data-[state=checked]:bg-blue-600"
            />
            <Label htmlFor="show-all" className="text-blue-100">
              Mostrar todos os nós
            </Label>
          </div>
          <Button
            onClick={fetchMenusData}
            variant="outline"
            className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de menus */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="lg:col-span-1 backdrop-blur-sm bg-white/5 border-white/10 shadow-xl text-white">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-blue-100">Menus do Fluxo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] pr-4">
                {Object.keys(menusData).map((menuId) => (
                  <div
                    key={menuId}
                    className={`p-3 cursor-pointer hover:bg-white/5 transition-colors ${
                      selectedNode === menuId
                        ? "bg-blue-600/20 border-l-2 border-blue-400"
                        : "border-l-2 border-transparent"
                    }`}
                    onClick={() => handleNodeClick(menuId)}
                  >
                    <div className="flex items-center">
                      {etapasTerminais.includes(menuId) ||
                      !menusData[menuId].opcoes ||
                      menusData[menuId].opcoes.length === 0 ? (
                        <div className="w-3 h-3 mr-2 rounded-full bg-gradient-to-br from-red-500 to-red-600" />
                      ) : (
                        <div className="w-3 h-3 mr-2 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                      )}
                      <div>
                        <div className="font-medium text-blue-50">{menusData[menuId].titulo}</div>
                        <div className="text-xs text-blue-300">
                          {menusData[menuId].opcoes?.length || 0} opções
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Visualização do fluxo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="backdrop-blur-sm bg-white/5 border-white/10 shadow-xl text-white">
            <CardHeader className="pb-0 border-b border-white/10">
              <CardTitle className="flex justify-between items-center text-blue-100">
                <span>Visualização do Fluxo</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/5 border-white/20 text-blue-200 hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      const flow = document.querySelector(".react-flow__renderer") as HTMLElement
                      if (flow) flow.style.zoom = `${Math.max(0.5, Math.min(2, (parseFloat(flow.style.zoom || "1") - 0.1)))}`
                    }}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-blue-200">Zoom</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/5 border-white/20 text-blue-200 hover:bg-white/10 hover:text-white"
                    onClick={() => {
                      const flow = document.querySelector(".react-flow__renderer") as HTMLElement
                      if (flow) flow.style.zoom = `${Math.max(0.5, Math.min(2, (parseFloat(flow.style.zoom || "1") + 0.1)))}`
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 bg-white/20" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-white/5 border-white/20 text-blue-200 hover:bg-white/10 hover:text-white"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] relative p-0">
              {/* Legenda */}
              <div className="absolute top-2 right-2 backdrop-blur-sm bg-black/30 p-2 rounded shadow-lg text-xs z-10 border border-white/10">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 mr-1 rounded-full bg-gradient-to-br from-green-500 to-green-600" />
                  <span className="text-blue-100">Menu normal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full bg-gradient-to-br from-red-500 to-red-600" />
                  <span className="text-blue-100">Menu terminal</span>
                </div>
              </div>
              {/* ReactFlow */}
              <div style={{ width: "100%", height: 500 }}>
                <ReactFlow
                  nodes={rfNodes.map((node) => ({
                    ...node,
                    style: {
                      ...node.style,
                      background: node.isTerminal ? "rgba(239,68,68,0.08)" : "rgba(37,99,235,0.08)",
                      border: node.isTerminal ? "1px solid #ef4444" : "1px solid #3b82f6",
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    },
                    className: `${node.className} ${node.isTerminal
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-blue-600/10 border-blue-500/30"
                    } ${selectedNode === node.id ? "ring-2 ring-blue-400" : ""}`,
                  }))}
                  edges={rfEdges.map((edge) => ({
                    ...edge,
                    style: { stroke: "#60a5fa", strokeWidth: 2 },
                    labelStyle: { fill: "#93c5fd", fontWeight: 500, fontSize: 12, background: "rgba(0,0,0,0.2)" },
                  }))}
                  onNodeClick={onNodeClick}
                  fitView
                  panOnDrag
                  zoomOnScroll
                  zoomOnPinch
                  selectionOnDrag
                  minZoom={0.5}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                >
                  <MiniMap />
                  <Controls />
                  <Background gap={16} />
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Editor de menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-4"
      >
        {selectedNode && editedMenu ? (
          <Card className="backdrop-blur-sm bg-white/5 border-white/10 shadow-xl text-white">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-blue-100">
                Editar Menu: {editedMenu.titulo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="mb-4 bg-white/5 text-blue-200">
                  <TabsTrigger
                    value="visual"
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    Editor Visual
                  </TabsTrigger>
                  <TabsTrigger value="json" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Editor JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="visual">
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <Label className="w-24 text-right text-blue-200">Título:</Label>
                        <Input
                          value={editedMenu.titulo}
                          onChange={(e) => handleMenuFieldChange("titulo", e.target.value)}
                          placeholder="Título do menu"
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-24 text-right text-blue-200">Descrição:</Label>
                        <Input
                          value={editedMenu.descricao}
                          onChange={(e) => handleMenuFieldChange("descricao", e.target.value)}
                          placeholder="Descrição"
                          className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                        />
                      </div>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="font-semibold mb-2 text-blue-100">Opções</div>
                    <div className="grid gap-2">
                      {editedMenu.opcoes.map((op, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Label className="w-12 text-right text-blue-200">ID:</Label>
                          <Input
                            value={op.id}
                            onChange={(e) => handleOptionChange(idx, "id", e.target.value)}
                            placeholder="ID"
                            className="w-16 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                          />
                          <Label className="w-16 text-right text-blue-200">Título:</Label>
                          <Input
                            value={op.titulo}
                            onChange={(e) => handleOptionChange(idx, "titulo", e.target.value)}
                            placeholder="Título"
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-red-400 hover:text-red-300 hover:bg-white/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={handleAddOption}
                        className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Opção
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
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="json">
                  <div className="space-y-4">
                    <pre className="bg-black/30 p-4 rounded overflow-auto h-64 text-sm text-blue-200 border border-white/10">
                      {JSON.stringify(editedMenu, null, 2)}
                    </pre>
                    <div className="flex justify-end">
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
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-sm bg-white/5 border-white/10 shadow-xl text-white">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-blue-100">Editor de Menu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 bg-blue-500/10 p-4 rounded-full">
                  <ArrowRight className="h-12 w-12 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white">Selecione um menu para editar</h3>
                <p className="mt-2 text-blue-200">
                  Clique em um menu no fluxograma ou na lista para editar suas opções.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
