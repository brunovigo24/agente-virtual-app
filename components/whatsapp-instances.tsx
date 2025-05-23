"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  RefreshCw,
  Plus,
  Search,
  Settings,
  Copy,
  Eye,
  EyeOff,
  RotateCw,
  Power,
  Trash2,
  Users,
  MessageSquare,
  Mail,
  Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

// Tipos
type WhatsAppInstance = {
  id: string
  name: string
  connectionStatus: "connected" | "disconnected"
  number: string
  profilePicUrl: string
  profileName: string
  token: string
  ownerJid: string
  _count: {
    Message: number
    Contact: number
    Chat: number
  }
}

export default function WhatsAppInstances() {
  // Estados
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [filteredInstances, setFilteredInstances] = useState<WhatsAppInstance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedInstance, setExpandedInstance] = useState<string | null>(null)
  const [showToken, setShowToken] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState<WhatsAppInstance | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState("")
  const [newInstanceNumber, setNewInstanceNumber] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Carregar instâncias
  useEffect(() => {
    fetchInstances()
  }, [])

  // Filtrar instâncias quando os filtros mudarem
  useEffect(() => {
    filterInstances()
  }, [instances, searchQuery, statusFilter])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("authToken")
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  const fetchInstances = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:3000/api/evolution/instance/fetchInstances', {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Erro ao buscar instâncias")
      let data = await response.json()
      // Normaliza o status
      data = data.map((instance: any) => ({
        ...instance,
        connectionStatus:
          instance.connectionStatus === "open"
            ? "connected"
            : instance.connectionStatus === "closed"
            ? "disconnected"
            : instance.connectionStatus,
      }))
      setInstances(data)
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as instâncias do WhatsApp.",
        open: true,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterInstances = () => {
    let filtered = [...instances]

    // Filtrar por nome
    if (searchQuery) {
      filtered = filtered.filter((instance) => instance.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Filtrar por status
    if (statusFilter !== "all") {
      filtered = filtered.filter((instance) =>
        statusFilter === "connected"
          ? instance.connectionStatus === "connected"
          : instance.connectionStatus === "disconnected",
      )
    }

    setFilteredInstances(filtered)
  }

  const handleCreateInstance = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('http://localhost:3000/api/evolution/instance/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nome: newInstanceName,
          numero: newInstanceNumber,
        }),
      })
      const responseBody = await response.text()
      console.log("CREATE RESPONSE", response.status, responseBody)
      if (!response.ok) throw new Error("Erro ao criar instância")
      toast({
        title: "Sucesso",
        description: "Nova instância criada com sucesso.",
        open: true,
      })
      setCreateDialogOpen(false)
      setNewInstanceName("")
      setNewInstanceNumber("")
      fetchInstances()
    } catch (error) {
      console.error("Erro ao criar instância:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a instância.",
        open: true,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleRestartInstance = async (id: string) => {
    try {
      const instance = instances.find(i => i.id === id)
      if (!instance) throw new Error("Instância não encontrada")
      const response = await fetch(`http://localhost:3000/api/evolution/instance/connect/${instance.name}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Erro ao reiniciar/conectar instância")
      toast({
        title: "Sucesso",
        description: "Instância reiniciada/conectada com sucesso.",
        open: true,
      })
      fetchInstances()
    } catch (error) {
      console.error("Erro ao reiniciar instância:", error)
      toast({
        title: "Erro",
        description: "Não foi possível reiniciar a instância.",
        open: true,
      })
    }
  }

  const handleDisconnectInstance = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/evolution/instance/logout/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Erro ao desconectar instância")
      toast({
        title: "Sucesso",
        description: "Instância desconectada com sucesso.",
        open: true,
      })
      fetchInstances()
    } catch (error) {
      console.error("Erro ao desconectar instância:", error)
      toast({
        title: "Erro",
        description: "Não foi possível desconectar a instância.",
        open: true,
      })
    }
  }

  const handleDeleteInstance = async (id: string) => {
    setIsDeleting(true)
    try {
      const instance = instances.find(i => i.id === id)
      if (!instance) throw new Error("Instância não encontrada")
      const response = await fetch(`http://localhost:3000/api/evolution/instance/delete/${instance.name}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const responseBody = await response.text()
      console.log("DELETE RESPONSE", response.status, responseBody)
      if (!response.ok) throw new Error("Erro ao excluir instância")
      toast({
        title: "Sucesso",
        description: "Instância excluída com sucesso.",
        open: true,
      })
      fetchInstances()
      setDeleteDialogOpen(false)
      setInstanceToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir instância:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a instância.",
        open: true,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExpandInstance = (id: string) => {
    setExpandedInstance(expandedInstance === id ? null : id)
  }

  const toggleShowToken = (id: string) => {
    setShowToken((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado",
      description: message,
      open: true,
    })
  }

  return (
    <div className="transfer-destinations bg-gradient-to-br from-slate-900/80 to-blue-900/60 min-h-screen p-4">
      <motion.div
        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white">Instâncias WhatsApp</h2>
          <p className="text-blue-200">Gerencie suas instâncias de WhatsApp conectadas ao sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchInstances}
            variant="outline"
            className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Instância
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="mb-6 flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative flex-1 ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200" />
          <Input
            placeholder="Pesquisar instâncias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Filtrar por status" className="text-white" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-blue-900">Todos</SelectItem>
            <SelectItem value="connected" className="text-blue-900">Conectados</SelectItem>
            <SelectItem value="disconnected" className="text-blue-900">Desconectados</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Lista de instâncias */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-blue-100">Carregando instâncias...</span>
        </div>
      ) : filteredInstances.length === 0 ? (
        <Card className="bg-white/5 border-white/10 shadow-xl backdrop-blur-sm text-white">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-500/10 p-3 mb-4">
              <Search className="h-6 w-6 text-blue-200" />
            </div>
            <h3 className="text-lg font-medium text-blue-100">Nenhuma instância encontrada</h3>
            <p className="text-blue-200 text-center mt-2">Não foram encontradas instâncias com os filtros aplicados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstances.map((instance, index) => (
            <motion.div
              key={instance.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`p-4 shadow-xl backdrop-blur-sm bg-white/5 border-white/10 text-white overflow-hidden transition-all duration-300 ${
                  expandedInstance === instance.id ? "ring-2 ring-blue-500" : "hover:shadow-md"
                }`}
                onClick={() => toggleExpandInstance(instance.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between p-0 pb-2 border-b border-white/10">
                  <CardTitle className="text-lg font-semibold text-blue-100">{instance.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${
                        instance.connectionStatus === "connected"
                          ? "bg-green-500/10 text-green-200 border-green-500/30"
                          : "bg-red-500/10 text-red-200 border-red-500/30"
                      }`}
                    >
                      {instance.connectionStatus === "connected" ? "Conectado" : "Desconectado"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-200 hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleExpandInstance(instance.id)
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full overflow-hidden bg-blue-500/10 flex items-center justify-center">
                      {instance.profilePicUrl ? (
                        <Image
                          src={instance.profilePicUrl || "/placeholder.svg"}
                          alt={instance.profileName}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {instance.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-100">{instance.profileName}</h3>
                      <p className="text-sm text-blue-200">{instance.number}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-md">
                      <div className="flex items-center text-blue-200 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-xs">Contatos</span>
                      </div>
                      <span className="font-semibold text-blue-100">{instance._count.Contact}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-md">
                      <div className="flex items-center text-blue-200 mb-1">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span className="text-xs">Chats</span>
                      </div>
                      <span className="font-semibold text-blue-100">{instance._count.Chat}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-md">
                      <div className="flex items-center text-blue-200 mb-1">
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="text-xs">Mensagens</span>
                      </div>
                      <span className="font-semibold text-blue-100">{instance._count.Message}</span>
                    </div>
                  </div>

                  {expandedInstance === instance.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-white/10"
                    >
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-blue-200 mb-1">Token</label>
                        <div className="flex items-center">
                          <div className="relative flex-1">
                            <Input
                              value={showToken[instance.id] ? instance.token : "********************************"}
                              readOnly
                              className="pr-16 font-mono text-sm bg-white/10 border-white/20 text-white"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-200 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleShowToken(instance.id)
                                }}
                              >
                                {showToken[instance.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-blue-200 hover:text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyToClipboard(instance.token, "Token copiado para a área de transferência")
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-blue-200 mb-1">JID</label>
                        <div className="flex items-center">
                          <Input value={instance.ownerJid} readOnly className="pr-8 font-mono text-sm bg-white/10 border-white/20 text-white" />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -ml-8 text-blue-200 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyToClipboard(instance.ownerJid, "JID copiado para a área de transferência")
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-500/10 text-blue-200 border-blue-500/30 hover:bg-blue-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRestartInstance(instance.id)
                          }}
                        >
                          <RotateCw className="h-3 w-3 mr-1" />
                          Reiniciar
                        </Button>

                        {instance.connectionStatus === "connected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-amber-500/10 text-amber-200 border-amber-500/30 hover:bg-amber-500/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDisconnectInstance(instance.id)
                            }}
                          >
                            <Power className="h-3 w-3 mr-1" />
                            Desconectar
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-500/10 text-red-200 border-red-500/30 hover:bg-red-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            setInstanceToDelete(instance)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir instância
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {expandedInstance !== instance.id && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-500/10 text-blue-200 border-blue-500/30 hover:bg-blue-500/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRestartInstance(instance.id)
                        }}
                      >
                        <RotateCw className="h-3 w-3 mr-1" />
                        Reiniciar
                      </Button>

                      {instance.connectionStatus === "connected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-amber-500/10 text-amber-200 border-amber-500/30 hover:bg-amber-500/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDisconnectInstance(instance.id)
                          }}
                        >
                          <Power className="h-3 w-3 mr-1" />
                          Desconectar
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500/10 text-red-200 border-red-500/30 hover:bg-red-500/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          setInstanceToDelete(instance)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[400px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white-100">Excluir Instância</DialogTitle>
            <DialogDescription className="text-white-200">
              Tem certeza que deseja excluir a instância <span className="font-bold text-red-300">{instanceToDelete?.name}</span>?<br />
              Esta ação não poderá ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (instanceToDelete) {
                  await handleDeleteInstance(instanceToDelete.id)
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de criação de instância */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[400px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white-100">Criar Nova Instância</DialogTitle>
            <DialogDescription className="text-white-200">
              Preencha os dados para criar uma nova instância.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Nome da instância"
              value={newInstanceName}
              onChange={e => setNewInstanceName(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
            />
            <Input
              placeholder="Número (ex: 5544988880000)"
              value={newInstanceNumber}
              onChange={e => setNewInstanceNumber(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInstance}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
              disabled={!newInstanceName || !newInstanceNumber || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
