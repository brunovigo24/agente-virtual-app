"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, RefreshCw, ArrowRight, X, Plus, ZoomIn, ZoomOut, Move, Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

// Definição de tipos
type FluxoData = {
  [key: string]: {
    [key: string]: string
  }
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
  label: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export default function FlowEditor() {
  // Estados
  const [fluxoData, setFluxoData] = useState<FluxoData>({})
  const [etapasTerminais, setEtapasTerminais] = useState<EtapaTerminal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editedOptions, setEditedOptions] = useState<{ [key: string]: string }>({})
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [edges, setEdges] = useState<FlowEdge[]>([])
  const [showAllNodes, setShowAllNodes] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Carregar dados do fluxo
  const fetchFluxoData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Simulando a resposta da API para fins de demonstração
      // Em produção, substituir por: const response = await fetch('http://localhost:3000/api/fluxo')
      const mockResponse = {
        menu_principal: {
          "1": "matriculas_menu",
          "2": "coordenacao_menu",
          "3": "financeiro_menu",
          "4": "documentacao_menu",
          "5": "rh_menu",
          "0": "encerrar_atendimento",
        },
        matriculas_menu: {
          "1": "matriculas_infantil",
          "2": "matriculas_fundamental",
          "3": "matriculas_medio",
          "0": "menu_principal",
        },
        matriculas_infantil: {
          "1": "matriculas_infantil_info",
          "2": "matriculas_infantil_solicitar_video",
          "0": "matriculas_menu",
        },
        matriculas_infantil_info: {
          "1": "matriculas_infantil",
          "0": "menu_principal",
        },
        matriculas_infantil_solicitar_video: {
          "1": "matriculas_infantil",
          "0": "menu_principal",
        },
        coordenacao_menu: {
          "1": "coordenacao_falar",
          "2": "coordenacao_horarios",
          "3": "coordenacao_agendar",
          "0": "menu_principal",
        },
        coordenacao_falar: {
          "1": "coordenacao_menu",
          "0": "menu_principal",
        },
        coordenacao_horarios: {
          "1": "coordenacao_menu",
          "0": "menu_principal",
        },
        coordenacao_agendar: {
          "1": "coordenacao_menu",
          "0": "menu_principal",
        },
        financeiro_menu: {
          "1": "financeiro_boleto",
          "2": "financeiro_negociacao",
          "3": "financeiro_mensalidades",
          "0": "menu_principal",
        },
        encerrar_atendimento: {},
      }

      // Etapas terminais (simulação)
      const mockTerminais = ["encerrar_atendimento"]

      setFluxoData(mockResponse)
      setEtapasTerminais(mockTerminais)

      // Processar dados para o fluxograma simplificado
      processFluxoData(mockResponse, mockTerminais)
    } catch (err) {
      console.error("Erro ao buscar dados do fluxo:", err)
      setError("Não foi possível carregar os dados do fluxo. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Implementação de layout hierárquico simplificado
  const processFluxoData = useCallback(
    (data: FluxoData, terminais: EtapaTerminal[]) => {
      const newNodes: FlowNode[] = []
      const newEdges: FlowEdge[] = []
      const processedNodes = new Set<string>()
      const currentPath = new Set<string>()

      // Mapeamento de níveis e colunas para posicionamento
      const nodeLevels: { [key: string]: number } = {}
      const nodeColumns: { [key: string]: number } = {}
      const levelCounts: { [key: number]: number } = {}

      // Primeira passagem: determinar níveis dos nós
      const assignLevels = (nodeId: string, level = 0, visited = new Set<string>()) => {
        if (visited.has(nodeId)) return
        visited.add(nodeId)

        // Atualizar nível do nó (usar o menor nível encontrado)
        if (nodeLevels[nodeId] === undefined || level < nodeLevels[nodeId]) {
          nodeLevels[nodeId] = level
          levelCounts[level] = (levelCounts[level] || 0) + 1
        }

        // Processar filhos
        const options = data[nodeId] || {}
        Object.values(options).forEach((targetId) => {
          if (data[targetId] || terminais.includes(targetId)) {
            assignLevels(targetId, level + 1, visited)
          }
        })
      }

      // Começar pelo menu principal
      assignLevels("menu_principal")

      // Segunda passagem: atribuir colunas dentro de cada nível
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

      // Função para adicionar nós e arestas recursivamente
      const processNode = (nodeId: string, level: number, parentId?: string) => {
        // Verifica se já estamos processando este nó no caminho atual (ciclo)
        if (currentPath.has(nodeId)) {
          // Se for um ciclo, apenas adicione a aresta e retorne
          if (parentId) {
            addEdge(parentId, nodeId)
          }
          return
        }

        // Verifica se já processamos este nó e não estamos mostrando todos
        if (processedNodes.has(nodeId) && !showAllNodes) {
          // Se já processamos, apenas adicione a aresta
          if (parentId) {
            addEdge(parentId, nodeId)
          }
          return
        }

        // Adicionar o nó ao caminho atual
        currentPath.add(nodeId)

        // Adicionar o nó
        const isTerminal = terminais.includes(nodeId) || Object.keys(data[nodeId] || {}).length === 0
        const nodeLabel = nodeId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())

        // Calcular posição baseada no nível e coluna
        const x = nodeColumns[nodeId] || 400
        const y = (nodeLevels[nodeId] || 0) * 150 + 100

        // Só adiciona o nó se ainda não foi processado
        if (!processedNodes.has(nodeId)) {
          newNodes.push({
            id: nodeId,
            label: nodeLabel,
            isTerminal,
            x,
            y,
            level: nodeLevels[nodeId] || 0,
            column: nodeColumns[nodeId] || 0,
            description: isTerminal ? "Etapa final" : `${Object.keys(data[nodeId] || {}).length} opções`,
          })

          processedNodes.add(nodeId)
        }

        // Adicionar arestas se houver um pai
        if (parentId) {
          addEdge(parentId, nodeId)
        }

        // Limitar a profundidade da recursão
        if (level >= 10) {
          currentPath.delete(nodeId) // Remove do caminho atual antes de retornar
          return
        }

        // Processar filhos se não for terminal e se estamos mostrando todos ou estamos no primeiro nível
        if (!isTerminal && (showAllNodes || level < 2)) {
          const options = data[nodeId] || {}

          Object.entries(options).forEach(([option, targetId]) => {
            // Verifica se o destino existe nos dados
            if (!data[targetId] && !terminais.includes(targetId)) {
              console.warn(`Destino não encontrado: ${targetId}`)
              return
            }

            processNode(targetId, level + 1, nodeId)
          })
        }

        // Remover o nó do caminho atual após processar
        currentPath.delete(nodeId)
      }

      // Função auxiliar para adicionar arestas
      const addEdge = (sourceId: string, targetId: string) => {
        const sourceNode = newNodes.find((n) => n.id === sourceId) || {
          x: nodeColumns[sourceId] || 0,
          y: (nodeLevels[sourceId] || 0) * 150 + 100,
        }

        const targetNode = newNodes.find((n) => n.id === targetId) || {
          x: nodeColumns[targetId] || 0,
          y: (nodeLevels[targetId] || 0) * 150 + 100,
        }

        const label = Object.entries(data[sourceId] || {}).find(([_, dest]) => dest === targetId)?.[0] || ""

        const edgeId = `${sourceId}-${targetId}`

        // Verificar se a aresta já existe
        if (!newEdges.some((e) => e.id === edgeId)) {
          newEdges.push({
            id: edgeId,
            source: sourceId,
            target: targetId,
            label,
            sourceX: sourceNode.x + 100, // centro do nó fonte
            sourceY: sourceNode.y + 25, // centro do nó fonte
            targetX: targetNode.x, // início do nó alvo
            targetY: targetNode.y + 25, // centro do nó alvo
          })
        }
      }

      // Começar pelo menu principal
      processNode("menu_principal", 0)

      setNodes(newNodes)
      setEdges(newEdges)

      // Reset zoom e pan ao carregar novos dados
      setZoom(1)
      setPan({ x: 0, y: 0 })
    },
    [showAllNodes],
  )

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchFluxoData()
  }, [fetchFluxoData])

  // Efeito para reprocessar dados quando showAllNodes muda
  useEffect(() => {
    if (Object.keys(fluxoData).length > 0) {
      processFluxoData(fluxoData, etapasTerminais)
    }
  }, [fluxoData, etapasTerminais, processFluxoData, showAllNodes])

  // Manipulador de clique em nó
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    setSelectedNodeData(fluxoData[nodeId] || {})
    setEditedOptions(fluxoData[nodeId] || {})
  }

  // Salvar alterações
  const handleSave = async () => {
    if (!selectedNode) return

    setIsSaving(true)
    try {
      // Simulando a requisição para a API
      // Em produção, substituir por:
      // const response = await fetch(`http://localhost:3000/api/fluxo/${selectedNode}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(editedOptions)
      // })

      // Simulando um delay para mostrar o loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Atualizar o estado local
      setFluxoData({
        ...fluxoData,
        [selectedNode]: editedOptions,
      })

      // Reprocessar o fluxo
      processFluxoData(
        {
          ...fluxoData,
          [selectedNode]: editedOptions,
        },
        etapasTerminais,
      )

      toast({
        title: "Fluxo atualizado",
        description: `As opções da etapa "${selectedNode}" foram atualizadas com sucesso.`,
      })
    } catch (err) {
      console.error("Erro ao salvar alterações:", err)
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Atualizar uma opção
  const handleOptionChange = (option: string, value: string) => {
    setEditedOptions({
      ...editedOptions,
      [option]: value,
    })
  }

  // Adicionar nova opção
  const handleAddOption = () => {
    const nextOptionNumber =
      Object.keys(editedOptions).length > 0
        ? Math.max(
            ...Object.keys(editedOptions)
              .map(Number)
              .filter((n) => !isNaN(n)),
          ) + 1
        : 1

    setEditedOptions({
      ...editedOptions,
      [nextOptionNumber.toString()]: "",
    })
  }

  // Remover opção
  const handleRemoveOption = (option: string) => {
    const newOptions = { ...editedOptions }
    delete newOptions[option]
    setEditedOptions(newOptions)
  }

  // Funções de zoom e pan
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 2))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Botão esquerdo do mouse
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan((prev) => ({
        x: prev.x + (e.clientX - dragStart.x) / zoom,
        y: prev.y + (e.clientY - dragStart.y) / zoom,
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Exportar fluxo como JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(fluxoData, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportFileDefaultName = "fluxo-atendimento.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando fluxo de atendimento...</span>
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
          <Button onClick={fetchFluxoData} variant="outline">
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
        {/* Lista de etapas */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle>Etapas do Fluxo</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {Object.keys(fluxoData).map((etapaId) => (
                <div
                  key={etapaId}
                  className={`mb-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
                    selectedNode === etapaId ? "bg-gray-100 border-l-4 border-primary" : ""
                  }`}
                  onClick={() => handleNodeClick(etapaId)}
                >
                  <div className="flex items-center">
                    {etapasTerminais.includes(etapaId) || Object.keys(fluxoData[etapaId] || {}).length === 0 ? (
                      <div className="w-3 h-3 mr-2 rounded-full bg-red-500" />
                    ) : (
                      <div className="w-3 h-3 mr-2 rounded-full bg-green-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {etapaId.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-gray-500">{Object.keys(fluxoData[etapaId] || {}).length} opções</div>
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
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="outline" size="icon" className={isDragging ? "bg-muted" : ""}>
                  <Move className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[500px] relative">
            <div
              className="h-full w-full overflow-auto border rounded-md p-4 bg-gray-50 relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
              ref={canvasRef}
            >
              {/* Legenda */}
              <div className="absolute top-2 right-2 bg-white p-2 rounded shadow-sm text-xs z-10">
                <div className="flex items-center mb-1">
                  <div className="w-3 h-3 mr-1 rounded-full bg-green-500" />
                  <span>Etapa normal</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 mr-1 rounded-full bg-red-500" />
                  <span>Etapa terminal</span>
                </div>
              </div>

              {/* Área de desenho com transformação para zoom e pan */}
              <div
                className="relative"
                style={{
                  width: "2000px",
                  height: "1500px",
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: "0 0",
                }}
              >
                {/* Conexões */}
                {edges.map((edge) => {
                  const sourceNode = nodes.find((n) => n.id === edge.source)
                  const targetNode = nodes.find((n) => n.id === edge.target)

                  if (!sourceNode || !targetNode) return null

                  // Calcular o ponto médio para o rótulo
                  const midX = (sourceNode.x + 100 + targetNode.x) / 2
                  const midY = (sourceNode.y + 25 + targetNode.y + 25) / 2

                  // Calcular ângulo e comprimento da linha
                  const dx = targetNode.x - (sourceNode.x + 100)
                  const dy = targetNode.y + 25 - (sourceNode.y + 25)
                  const angle = Math.atan2(dy, dx)
                  const length = Math.sqrt(dx * dx + dy * dy)

                  return (
                    <div key={edge.id} className="absolute">
                      {/* Linha de conexão */}
                      <div
                        className="absolute border-t-2 border-gray-300 transform origin-left"
                        style={{
                          left: `${sourceNode.x + 100}px`,
                          top: `${sourceNode.y + 25}px`,
                          width: `${length}px`,
                          transform: `rotate(${angle}rad)`,
                        }}
                      />

                      {/* Rótulo da conexão */}
                      <div
                        className="absolute bg-white px-2 py-1 rounded-md text-xs border border-gray-200 z-10 shadow-sm"
                        style={{
                          left: `${midX}px`,
                          top: `${midY}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        Opção {edge.label}
                      </div>

                      {/* Seta no final da linha */}
                      <div
                        className="absolute w-3 h-3 border-t-2 border-r-2 border-gray-300 transform rotate-45"
                        style={{
                          left: `${targetNode.x - 5}px`,
                          top: `${targetNode.y + 25}px`,
                          transform: "translate(-50%, -50%) rotate(45deg)",
                        }}
                      />
                    </div>
                  )
                })}

                {/* Nós */}
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`absolute px-4 py-2 shadow-md rounded-md border cursor-pointer transition-all duration-200 ${
                      node.isTerminal ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                    } ${selectedNode === node.id ? "ring-2 ring-primary" : ""} hover:shadow-lg`}
                    style={{
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      width: "200px",
                      zIndex: selectedNode === node.id ? 10 : 1,
                    }}
                    onClick={() => handleNodeClick(node.id)}
                  >
                    <div className="flex items-center">
                      {node.isTerminal ? (
                        <div className="w-3 h-3 mr-2 rounded-full bg-red-500" />
                      ) : (
                        <div className="w-3 h-3 mr-2 rounded-full bg-green-500" />
                      )}
                      <div>
                        <div className="font-bold">{node.label}</div>
                        {node.description && <div className="text-xs text-gray-500">{node.description}</div>}
                      </div>
                    </div>
                    {node.isTerminal && (
                      <Badge variant="outline" className="mt-1 text-xs bg-red-50">
                        Terminal
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor de opções */}
      {selectedNode ? (
        <Card className="mt-4 shadow-md">
          <CardHeader>
            <CardTitle>
              Editar Etapa: {selectedNode.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
                    {Object.entries(editedOptions).map(([option, destination]) => (
                      <div key={option} className="flex items-center gap-2">
                        <Label htmlFor={`option-${option}`} className="w-12 text-right">
                          Opção {option}:
                        </Label>
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            id={`option-${option}`}
                            value={destination}
                            onChange={(e) => handleOptionChange(option, e.target.value)}
                            placeholder="ID da etapa de destino"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveOption(option)}
                            className="text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <div className="w-48">
                          {destination && fluxoData[destination] ? (
                            <Badge variant="outline" className="bg-green-50">
                              {destination.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </Badge>
                          ) : destination === "encerrar_atendimento" ? (
                            <Badge variant="outline" className="bg-red-50">
                              Encerrar Atendimento
                            </Badge>
                          ) : destination ? (
                            <Badge variant="outline" className="bg-red-50">
                              Destino não encontrado
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">Selecione um destino</span>
                          )}
                        </div>
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
                    {JSON.stringify(editedOptions, null, 2)}
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
            <CardTitle>Editor de Opções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <div className="mb-4">
                <ArrowRight className="h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium">Selecione uma etapa para editar</h3>
              <p className="mt-2">Clique em uma etapa no fluxograma ou na lista para editar suas opções.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
