"use client"

import { useState, useEffect, useRef } from "react"
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
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useFetchWithAuth } from "@/lib/fetchWithAuth"
import { API_BASE_URL } from "@/lib/apiBaseUrl"

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
  const [showToken, setShowToken] = useState<Record<string, boolean>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [instanceToDelete, setInstanceToDelete] = useState<WhatsAppInstance | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newInstanceName, setNewInstanceName] = useState("")
  const [newInstanceNumber, setNewInstanceNumber] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [qrData, setQrData] = useState<Record<string, {
    loading: boolean,
    error: string | null,
    qrBase64: string | null,
    pairingCode: string | null,
    code: string | null,
  }>>({})
  const [modalInstance, setModalInstance] = useState<WhatsAppInstance | null>(null)
  const [pollingActive, setPollingActive] = useState<Record<string, boolean>>({})
  const pollingIntervalRef = useRef<Record<string, NodeJS.Timeout | null>>({})
  const [error, setError] = useState<string | null>(null)
  const fetchWithAuth = useFetchWithAuth()

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
      const response = await fetchWithAuth(`${API_BASE_URL}/api/evolution/instance/fetchInstances`, {
        headers: getAuthHeaders(),
      })
      if (!response) return;
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
      setError("Não foi possível carregar as instâncias do WhatsApp.")
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

  // Função para formatar o número de telefone
  const formatPhoneNumber = (value: string) => {
    let digits = value.replace(/\D/g, "");
    digits = digits.slice(0, 13);

    // Monta o formato +55 (44) 99999-9999
    let formatted = "";
    if (digits.length > 0) {
      formatted += "+" + digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += " (" + digits.slice(2, 4) + ")";
    }
    if (digits.length > 4) {
      formatted += " " + digits.slice(4, 9);
    }
    if (digits.length > 9) {
      formatted += "-" + digits.slice(9, 13);
    }
    return formatted;
  };

  // Função para extrair apenas os dígitos do número formatado
  const getOnlyDigits = (value: string) => {
    return value.replace(/\D/g, "");
  };

  // Função para validar se o número tem código de país e DDD
  const isValidPhoneNumber = (value: string) => {
    const digits = getOnlyDigits(value);
    // Deve ter 13 dígitos: 2 (país) + 2 (DDD) + 9 (número)
    return digits.length === 13;
  };

  const handleCreateInstance = async () => {
    setIsCreating(true)
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/evolution/instance/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nome: newInstanceName,
          numero: getOnlyDigits(newInstanceNumber),
        }),
      })
      if (!response) return;
      const responseBody = await response.text()
      console.log("CREATE RESPONSE", response.status, responseBody)
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
      const response = await fetch(`${API_BASE_URL}/api/evolution/instance/connect/${instance.name}`, {
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
      const instance = instances.find(i => i.id === id)
      if (!instance) throw new Error("Instância não encontrada")
      const response = await fetch(`${API_BASE_URL}/api/evolution/instance/logout/${instance.name}`, {
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
      
      const response = await fetch(`${API_BASE_URL}/api/evolution/instance/delete/${instance.name}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      const responseBody = await response.text()
      console.log("DELETE RESPONSE", response.status, responseBody)
      
      if (!response.ok) throw new Error("Erro ao excluir instância")
      
      await fetchInstances()
      setDeleteDialogOpen(false)
      setInstanceToDelete(null)
      setModalInstance(null)
      
      toast({
        title: "Sucesso",
        description: "Instância excluída com sucesso.",
        open: true,
      })
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

  // Função para buscar QR Code e Pairing Code (agora pode ser chamada pelo polling)
  const fetchQrData = async (instanceName: string, { silent = false } = {}) => {
    if (!silent) {
      setQrData(prev => ({
        ...prev,
        [instanceName]: { loading: true, error: null, qrBase64: null, pairingCode: null, code: null }
      }))
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/evolution/instance/connect/${instanceName}`, {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw new Error("Erro ao buscar QR Code")
      const data = await response.json()
      setQrData((prev: typeof qrData) => {
        // Só atualiza se mudou
        if (prev[instanceName]?.qrBase64 !== data.base64) {
          return {
            ...prev,
            [instanceName]: {
              loading: false,
              error: null,
              qrBase64: data.base64 || null,
              pairingCode: data.pairingCode || null,
              code: data.code || null,
            }
          }
        } else {
          return {
            ...prev,
            [instanceName]: {
              ...prev[instanceName],
              loading: false,
              error: null,
            }
          }
        }
      })
    } catch (error: any) {
      setQrData(prev => ({
        ...prev,
        [instanceName]: {
          loading: false,
          error: error.message || "Erro desconhecido",
          qrBase64: null,
          pairingCode: null,
          code: null,
        }
      }))
    }
  }

  // Iniciar polling ao clicar em Gerar QR Code
  const handleStartQrPolling = (instanceName: string) => {
    setPollingActive(prev => ({ ...prev, [instanceName]: true }))
    fetchQrData(instanceName)
  }

  // Parar polling
  const stopQrPolling = (instanceName: string) => {
    setPollingActive(prev => ({ ...prev, [instanceName]: false }))
    if (pollingIntervalRef.current[instanceName]) {
      clearInterval(pollingIntervalRef.current[instanceName]!)
      pollingIntervalRef.current[instanceName] = null
    }
  }

  // Polling effect
  useEffect(() => {
    if (!modalInstance) return
    const instanceName = modalInstance.name
    if (pollingActive[instanceName] && modalInstance.connectionStatus !== "connected") {
      // Inicia polling
      if (pollingIntervalRef.current[instanceName]) {
        clearInterval(pollingIntervalRef.current[instanceName]!)
      }
      pollingIntervalRef.current[instanceName] = setInterval(() => {
        fetchQrData(instanceName, { silent: true })
      }, 5000)
    } else {
      // Para polling
      if (pollingIntervalRef.current[instanceName]) {
        clearInterval(pollingIntervalRef.current[instanceName]!)
        pollingIntervalRef.current[instanceName] = null
      }
    }
    // Limpa ao desmontar/modal fechar (sem fetchInstances automático)
    return () => {
      if (pollingIntervalRef.current[instanceName]) {
        clearInterval(pollingIntervalRef.current[instanceName]!)
        pollingIntervalRef.current[instanceName] = null
      }
    }
  }, [modalInstance, pollingActive, modalInstance?.connectionStatus])

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-500/20 border border-red-500/50 text-red-200">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Instâncias WhatsApp</h2>
          <p className="text-blue-200">Gerencie suas instâncias de WhatsApp conectadas ao sistema.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchInstances}
            variant="outline"
            className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white rounded-2xl"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
          >
            <Plus className="h-4 w-4 mr-2" />
            Instância
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 ">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-200" />
          <Input
            placeholder="Pesquisar instâncias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 rounded-2xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white rounded-2xl">
            <SelectValue placeholder="Filtrar por status"/>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/10 text-white rounded-2xl">
            <SelectItem value="all" className="rounded-2xl">Todos</SelectItem>
            <SelectItem value="connected" className="rounded-2xl">Conectados</SelectItem>
            <SelectItem value="disconnected" className="rounded-2xl">Desconectados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de instâncias */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-blue-100">Carregando instâncias...</span>
        </div>
      ) : filteredInstances.length === 0 ? (
        <Card className="bg-white/5 border-white/10 shadow-xl backdrop-blur-sm text-white rounded-2xl">
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
                className={`p-4 shadow-xl backdrop-blur-sm bg-white/5 border-white/10 text-white overflow-hidden transition-all duration-300 rounded-2xl`}
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
                        setModalInstance(instance)
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
                          alt={instance.profileName || `Foto de ${instance.name}` || "Foto do perfil"}
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
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-2xl">
                      <div className="flex items-center text-blue-200 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="text-xs">Contatos</span>
                      </div>
                      <span className="font-semibold text-blue-100">{instance._count.Contact}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-2xl">
                      <div className="flex items-center text-blue-200 mb-1">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        <span className="text-xs">Chats</span>
                      </div>
                      <span className="font-semibold text-blue-100">{instance._count.Chat}</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-2xl">
                      <div className="flex items-center text-blue-200 mb-1">
                        <Mail className="h-4 w-4 mr-1" />
                        <span className="text-xs">Mensagens</span>
                      </div>
                      <span className="font-semibold text-blue-100">{instance._count.Message}</span>
                    </div>
                  </div>
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
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (instanceToDelete) {
                  await handleDeleteInstance(instanceToDelete.id)
                }
              }}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-2xl"
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
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 rounded-2xl"
            />
            <Input
              placeholder="Número (ex: +55 (44) 00000-0000)"
              value={newInstanceNumber}
              onChange={e => setNewInstanceNumber(formatPhoneNumber(e.target.value))}
              inputMode="numeric"
              className="bg-white/10 border-white/20 text-white placeholder:text-blue-200/50 rounded-2xl"
            />                <p className="text-xs text-white-300">
            Formato permitido: +55 (44) 00000-0000
          </p>             
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInstance}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
              disabled={!newInstanceName || !isValidPhoneNumber(newInstanceNumber) || isCreating}
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

      {/* Modal de configurações da instância */}
      <Dialog open={!!modalInstance} onOpenChange={open => setModalInstance(open ? modalInstance : null)}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[500px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/5 text-white">
          <DialogHeader>
            <DialogTitle className="text-white-100">Configurações da Instância</DialogTitle>
            <DialogDescription className="text-white-200">
              Detalhes e ações para a instância <span className="font-bold text-blue-300">{modalInstance?.name}</span>
            </DialogDescription>
          </DialogHeader>
          {modalInstance && (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-2xl">
                  <div className="flex items-center text-blue-200 mb-1">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-xs">Contatos</span>
                  </div>
                  <span className="font-semibold text-blue-100">{modalInstance._count.Contact}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-2xl">
                  <div className="flex items-center text-blue-200 mb-1">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="text-xs">Chats</span>
                  </div>
                  <span className="font-semibold text-blue-100">{modalInstance._count.Chat}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-blue-500/10 rounded-2xl">
                  <div className="flex items-center text-blue-200 mb-1">
                    <Mail className="h-4 w-4 mr-1" />
                    <span className="text-xs">Mensagens</span>
                  </div>
                  <span className="font-semibold text-blue-100">{modalInstance._count.Message}</span>
                </div>
              </div>
              {/* Token */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-200 mb-1">Token</label>
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <Input
                      value={showToken[modalInstance.id] ? (modalInstance.token ?? "") : "********************************"}
                      readOnly
                      className="pr-16 font-mono text-sm bg-white/10 border-white/20 text-white rounded-2xl"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-200 hover:text-white"
                        onClick={() => toggleShowToken(modalInstance.id)}
                      >
                        {showToken[modalInstance.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-200 hover:text-white"
                        onClick={() => copyToClipboard(modalInstance.token, "Token copiado para a área de transferência")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              {/* JID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-blue-200 mb-1">JID</label>
                <div className="flex items-center">
                  <Input value={modalInstance.ownerJid ?? ""} readOnly className="pr-8 font-mono text-sm bg-white/10 border-white/20 text-white rounded-2xl" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-8 text-blue-200 hover:text-white"
                    onClick={() => copyToClipboard(modalInstance.ownerJid, "JID copiado para a área de transferência")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {/* QR Code e Pairing Code */}
              {modalInstance.connectionStatus !== "connected" && (
                <div className="mb-6">
                  <div className="mb-2 text-blue-200 text-sm">
                    Para conectar, escaneie o QR Code com o WhatsApp
                  </div>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
                      onClick={() => handleStartQrPolling(modalInstance.name)}
                      disabled={qrData[modalInstance.name]?.loading || modalInstance.connectionStatus === "connected"}
                    >
                      {qrData[modalInstance.name]?.loading ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Gerando QR Code...</>
                      ) : (
                        <>Gerar QR Code</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
                      onClick={() => fetchQrData(modalInstance.name)}
                      disabled={qrData[modalInstance.name]?.loading}
                    >
                      {qrData[modalInstance.name]?.loading ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Gerando Código...</>
                      ) : (
                        <>Gerar Código de Pareamento</>
                      )}
                    </Button>
                  </div>
                  {/* Exibição do QR Code e Pairing Code */}
                  {qrData[modalInstance.name]?.error && (
                    <div className="text-red-400 text-xs mb-2">{qrData[modalInstance.name]?.error}</div>
                  )}
                  {qrData[modalInstance.name]?.qrBase64 && (
                    <div className="flex flex-col items-center mb-2">
                      <img src={String(qrData[modalInstance.name]?.qrBase64 || "")} alt="QR Code" className="w-49 h-49 bg-white rounded p-1" />
                      <div className="text-xs text-blue-200 mt-1">Escaneie o QR Code acima com o WhatsApp</div>
                    </div>
                  )}
                  {qrData[modalInstance.name]?.pairingCode && (
                    <div className="flex flex-col items-center mb-2">
                      <div className="font-mono text-lg bg-white/10 border border-white/20 rounded px-3 py-2 text-blue-100">
                        {qrData[modalInstance.name]?.pairingCode}
                      </div>
                      <div className="text-xs text-blue-200 mt-1">Código de pareamento</div>
                    </div>
                  )}
                </div>
              )}
              {/* Botões de ação */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
                  onClick={() => fetchQrData(modalInstance.name)}
                >
                  <RotateCw className="h-3 w-3 mr-1" />
                  Reiniciar
                </Button>
                {modalInstance.connectionStatus === "connected" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-600 hover:to-amber-500 text-white rounded-2xl"
                    onClick={() => handleDisconnectInstance(modalInstance.id)}
                  >
                    <Power className="h-3 w-3 mr-1" />
                    Desconectar
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-2xl"
                  onClick={() => {
                    setInstanceToDelete(modalInstance)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir instância
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
