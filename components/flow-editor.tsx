"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, RefreshCw, ArrowRight, X, Plus, Download } from "lucide-react"
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

// Tipos auxiliares para o layout do fluxo
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
            background: node.isTerminal ? "#fef2f2" : "#fff",
            border: node.isTerminal ? "1px solid #fecaca" : "1px solid #e5e7eb",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            borderRadius: 8,
            zIndex: selectedNode === node.id ? 10 : 1,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          className: selectedNode === node.id ? "ring-2 ring-primary" : "",
        })),
      )
      setRfEdges(
        newEdges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: false,
          style: { stroke: "#d1d5db", strokeWidth: 2 },
          labelStyle: { fill: "#374151", fontWeight: 500, fontSize: 12, background: "#fff" },
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando menus...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flow-editor">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Editor de Fluxo</h2>
          <p className="text-muted-foreground">Visualize e edite o fluxo de atendimento do seu sistema.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Switch id="show-all" checked={showAllNodes} onCheckedChange={setShowAllNodes} />
            <Label htmlFor="show-all">Mostrar todos os nós</Label>
          </div>
          <Button onClick={fetchMenusData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleExportJSON} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shadow-sm">
        {/* Lista de menus */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Menus do Fluxo</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {Object.keys(menusData).map((menuId) => (
                <div
                  key={menuId}
                  className={`mb-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    selectedNode === menuId ? "bg-gray-100 border-l-4 border-primary" : ""
                  }`}
                  onClick={() => handleNodeClick(menuId)}
                >
                  <div className="flex items-center">
                    {etapasTerminais.includes(menuId) ||
                    !menusData[menuId].opcoes ||
                    menusData[menuId].opcoes.length === 0 ? (
                      <div className="w-3 h-3 mr-2 rounded-full bg-red-500" />
                    ) : (
                      <div className="w-3 h-3 mr-2 rounded-full bg-green-500" />
                    )}
                    <div>
                      <div className="font-medium">{menusData[menuId].titulo}</div>
                      <div className="text-xs text-gray-500">
                        {menusData[menuId].opcoes?.length || 0} opções
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Visualização do fluxo */}
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader className="pb-0">
            <CardTitle className="flex justify-between items-center">
              <span>Visualização do Fluxo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] relative">
            {/* Legenda */}
            <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-sm text-xs z-10">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 mr-1 rounded-full bg-green-500" />
                <span>Menu normal</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1 rounded-full bg-red-500" />
                <span>Menu terminal</span>
              </div>
            </div>
            {/* ReactFlow */}
            <div style={{ width: "100%", height: 500 }}>
              <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
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
      </div>

      {/* Editor de menu */}
      {selectedNode && editedMenu ? (
        <Card className="mt-4 shadow-md">
          <CardHeader>
            <CardTitle>
              Editar Menu: {editedMenu.titulo}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="visual">
              <TabsList className="mb-4">
                <TabsTrigger value="visual">Editor Visual</TabsTrigger>
                <TabsTrigger value="json">Editor JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="visual">
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-right">Título:</Label>
                      <Input
                        value={editedMenu.titulo}
                        onChange={(e) => handleMenuFieldChange("titulo", e.target.value)}
                        placeholder="Título do menu"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="w-24 text-right">Descrição:</Label>
                      <Input
                        value={editedMenu.descricao}
                        onChange={(e) => handleMenuFieldChange("descricao", e.target.value)}
                        placeholder="Descrição"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="font-semibold mb-2">Opções</div>
                  <div className="grid gap-2">
                    {editedMenu.opcoes.map((op, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Label className="w-12 text-right">ID:</Label>
                        <Input
                          value={op.id}
                          onChange={(e) => handleOptionChange(idx, "id", e.target.value)}
                          placeholder="ID"
                          className="w-16"
                        />
                        <Label className="w-16 text-right">Título:</Label>
                        <Input
                          value={op.titulo}
                          onChange={(e) => handleOptionChange(idx, "titulo", e.target.value)}
                          placeholder="Título"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handleAddOption}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Opção
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
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
                  <pre className="bg-gray-100 p-4 rounded overflow-auto h-64 text-sm">
                    {JSON.stringify(editedMenu, null, 2)}
                  </pre>
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
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
        <Card className="mt-4 shadow-md">
          <CardHeader>
            <CardTitle>Editor de Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="mb-4">
                <ArrowRight className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium">Selecione um menu para editar</h3>
              <p className="mt-2">Clique em um menu no fluxograma ou na lista para editar suas opções.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
