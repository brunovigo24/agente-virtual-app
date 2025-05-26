"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Save, Loader2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";

type Mensagem = {
  id: string;
  titulo: string;
  conteudo: string;
};

export default function SystemMessages() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Mensagem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    fetchMensagens();
  }, []);

  // Função utilitária para requisições autenticadas
  function getAuthHeaders() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const fetchMensagens = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/mensagens", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar mensagens");
      const data = await response.json();
      const mensagensArray = Object.entries(data).map(([id, conteudo]) => {
        const titulo = id
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .replace(/([a-z])([A-Z])/g, "$1 $2");
        return { id, titulo, conteudo };
      });
      setMensagens(mensagensArray);
    } catch (err) {
      setError(
        "Não foi possível carregar as mensagens. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (mensagem: Mensagem) => {
    setEditingMessage(mensagem);
    setIsDialogOpen(true);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    if (!editingMessage) return;
    setIsSaving(true);
    setSaveSuccess(null);
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
      );
      if (!response.ok) throw new Error("Erro ao salvar mensagem");
      setMensagens(
        mensagens.map((msg) =>
          msg.id === editingMessage.id ? editingMessage : msg
        )
      );
      setSaveSuccess(true);
      toast({
        title: "Mensagem atualizada",
        description: `A mensagem "${editingMessage.titulo}" foi atualizada com sucesso.`,
      });
      setTimeout(() => {
        setIsDialogOpen(false);
        setEditingMessage(null);
      }, 1000);
    } catch (err) {
      setSaveSuccess(false);
      setError("Erro ao salvar mensagem. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900/80 to-blue-900/60">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-100">Carregando mensagens...</span>
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
    <div className="system-messages bg-gradient-to-br from-slate-900/80 to-blue-900/60 min-h-screen p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Mensagens do Atendente
          </h2>
          <p className="text-blue-200">
            Configure as mensagens pré-definidas que o Agente virtual
            utilizará.
          </p>
        </div>
        <Button
          onClick={fetchMensagens}
          variant="outline"
          className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4">
        {mensagens.map((mensagem, index) => (
          <motion.div
            key={mensagem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card
              className="p-4 shadow-xl backdrop-blur-sm bg-white/5 border-white/10 text-white"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg text-blue-100">
                    {mensagem.titulo}
                  </h3>
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 border-blue-500/30 text-blue-200"
                  >
                    {mensagem.id}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(mensagem)}
                  className="text-blue-200 hover:text-white hover:bg-white/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
              <div className="whitespace-pre-wrap bg-blue-900/20 p-3 rounded-md text-sm text-blue-100">
                {mensagem.conteudo}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/10 text-white">
          {/* Removi backdrop-blur-md */}
          <DialogHeader>
            <DialogTitle className="text-blue-100">Editar Mensagem</DialogTitle>
            <DialogDescription className="text-blue-200">
              Edite o conteúdo da mensagem "{editingMessage?.titulo}". Use
              asteriscos (*) para texto em negrito.
            </DialogDescription>
          </DialogHeader>

          {editingMessage && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="mensagem" className="text-blue-200">
                  Conteúdo da mensagem
                </Label>
                <Textarea
                  id="mensagem"
                  rows={10}
                  value={editingMessage.conteudo}
                  onChange={(e) =>
                    setEditingMessage({
                      ...editingMessage,
                      conteudo: e.target.value,
                    })
                  }
                  className="font-mono bg-white/10 border-white/20 text-white placeholder:text-blue-200/50"
                />
              </div>

              <div className="bg-blue-900/20 p-3 rounded-md">
                <Label className="mb-2 block text-blue-200">
                  Pré-visualização:
                </Label>
                <div className="whitespace-pre-wrap text-sm text-blue-100">
                  {editingMessage.conteudo}
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
                  Salvar alterações
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
