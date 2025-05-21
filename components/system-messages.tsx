"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Edit, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Mensagem = {
  id: string
  titulo: string
  conteudo: string
}

export default function SystemMessages() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Mensagem | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null)

  useEffect(() => {
    fetchMensagens()
  }, [])

  // Função utilitária para requisições autenticadas
  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const fetchMensagens = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:3000/api/mensagens", {
        headers: {
          ...getAuthHeaders(),
        },
      })
      if (!response.ok) throw new Error("Erro ao buscar mensagens")
      const data = await response.json()
      const mensagensArray = Object.entries(data).map(([id, conteudo]) => {
        const titulo = id
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .replace(/([a-z])([A-Z])/g, "$1 $2")
        return { id, titulo, conteudo }
      })
      setMensagens(mensagensArray)
    } catch (err) {
      setError("Não foi possível carregar as mensagens. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (mensagem: Mensagem) => {
    setEditingMessage(mensagem)
    setIsDialogOpen(true)
    setSaveSuccess(null)
  }

  const handleSave = async () => {
    if (!editingMessage) return
    setIsSaving(true)
    setSaveSuccess(null)
    try {
      const response = await fetch(
        `http://localhost:3000/api/mensagens/${editingMessage.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ conteudo: editingMessage.conteudo }),
        }
      )
      if (!response.ok) throw new Error("Erro ao salvar mensagem")
      setMensagens(mensagens.map((msg) => (msg.id === editingMessage.id ? editingMessage : msg)))
      setSaveSuccess(true)
      toast({
        title: "Mensagem atualizada",
        description: `A mensagem "${editingMessage.titulo}" foi atualizada com sucesso.`,
      })
      setTimeout(() => {
        setIsDialogOpen(false)
        setEditingMessage(null)
      }, 1000)
    } catch (err) {
      setSaveSuccess(false)
      setError("Erro ao salvar mensagem. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando mensagens...</span>
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
    <div className="system-messages">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mensagens do Atendente</h2>
          <p className="text-muted-foreground">
            Configure as mensagens pré-definidas que o atendente virtual utilizará.
          </p>
        </div>
        <Button onClick={fetchMensagens} variant="outline">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {mensagens.map((mensagem) => (
          <Card key={mensagem.id} className="p-4 shadow-md">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{mensagem.titulo}</h3>
                <Badge variant="outline">{mensagem.id}</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleEdit(mensagem)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
            <div className="whitespace-pre-wrap bg-muted p-3 rounded-md text-sm">{mensagem.conteudo}</div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Mensagem</DialogTitle>
            <DialogDescription>
              Edite o conteúdo da mensagem "{editingMessage?.titulo}". Use asteriscos (*) para texto em negrito.
            </DialogDescription>
          </DialogHeader>

          {editingMessage && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mensagem">Conteúdo da mensagem</Label>
                <Textarea
                  id="mensagem"
                  rows={10}
                  value={editingMessage.conteudo}
                  onChange={(e) => setEditingMessage({ ...editingMessage, conteudo: e.target.value })}
                  className="font-mono"
                />
              </div>

              <div className="bg-muted p-3 rounded-md">
                <Label className="mb-2 block">Pré-visualização:</Label>
                <div className="whitespace-pre-wrap text-sm">{editingMessage.conteudo}</div>
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
                  Salvar alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
