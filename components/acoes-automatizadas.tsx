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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";

// Tipo da ação automatizada
export type Acao = {
  id: string;
  etapa: string;
  opcao: string;
  acao_tipo: string;
  conteudo: string;
};

export default function AcoesAutomatizadas() {
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAcao, setEditingAcao] = useState<Acao | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Função utilitária para requisições autenticadas
  function getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    fetchAcoes();
  }, []);

  const fetchAcoes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/acoes", {
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!response.ok) throw new Error("Erro ao buscar ações");
      const data = await response.json();
      setAcoes(data);
    } catch (err) {
      setError("Não foi possível carregar as ações. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (acao: Acao) => {
    setEditingAcao(acao);
    setIsDialogOpen(true);
    setSaveSuccess(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingAcao({ id: "", etapa: "", opcao: "", acao_tipo: "mensagem", conteudo: "" });
    setIsDialogOpen(true);
    setSaveSuccess(null);
    setIsCreating(true);
  };

  const handleDelete = async (acao: Acao) => {
    if (!window.confirm("Tem certeza que deseja deletar esta ação?")) return;
    try {
      const response = await fetch(`http://localhost:3000/api/acoes/${acao.id}`, {
        method: "DELETE",
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!response.ok) throw new Error("Erro ao deletar ação");
      setAcoes(acoes.filter((a) => a.id !== acao.id));
      toast({
        title: "Ação deletada",
        description: `A ação foi removida com sucesso.`,
        open: true,
      });
    } catch (err) {
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a ação.",
        open: true,
      });
    }
  };

  const handleSave = async () => {
    if (!editingAcao) return;
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      let response;
      if (isCreating) {
        response = await fetch("http://localhost:3000/api/acoes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthHeaders() as HeadersInit),
          },
          body: JSON.stringify({
            etapa: editingAcao.etapa,
            opcao: editingAcao.opcao,
            acao_tipo: editingAcao.acao_tipo,
            conteudo: editingAcao.conteudo,
          }),
        });
      } else {
        response = await fetch(`http://localhost:3000/api/acoes/${editingAcao.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthHeaders() as HeadersInit),
          },
          body: JSON.stringify({
            opcao: editingAcao.opcao,
            acao_tipo: editingAcao.acao_tipo,
            conteudo: editingAcao.conteudo,
          }),
        });
      }
      if (!response.ok) throw new Error("Erro ao salvar ação");
      setSaveSuccess(true);
      setIsDialogOpen(false);
      setEditingAcao(null);
      fetchAcoes();
      toast({
        title: isCreating ? "Ação criada" : "Ação atualizada",
        description: isCreating ? "A nova ação foi criada com sucesso." : "A ação foi atualizada com sucesso.",
        open: true,
      });
    } catch (err) {
      setSaveSuccess(false);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a ação.",
        open: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900/80 to-blue-900/60">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <span className="ml-2 text-blue-100">Carregando ações...</span>
      </div>
    );
  }

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
    <div className="acoes-automatizadas bg-gradient-to-br from-slate-900/80 to-blue-900/60 min-h-screen p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Ações Automatizadas</h2>
          <p className="text-blue-200">Gerencie as ações automatizadas do sistema.</p>
        </div>
        <Button
          onClick={handleCreate}
          variant="outline"
          className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white flex gap-2"
        >
          <Plus className="h-4 w-4" /> Nova Ação
        </Button>
      </div>

      <div className="grid gap-4">
        {acoes.length === 0 && (
          <div className="text-blue-100">Nenhuma ação cadastrada.</div>
        )}
        {acoes.map((acao, index) => (
          <motion.div
            key={acao.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white/5 border-white/10">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-200 text-xs">
                    {acao.etapa}
                  </Badge>
                  <Badge variant="outline" className="bg-green-500/20 text-green-200 text-xs">
                    Opção: {acao.opcao}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-200 text-xs">
                    {acao.acao_tipo}
                  </Badge>
                </div>
                <div className="text-white font-medium mt-1">{acao.conteudo}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button size="icon" variant="ghost" title="Editar" onClick={() => handleEdit(acao)}>
                  <Edit className="h-4 w-4 text-blue-300" />
                </Button>
                <Button size="icon" variant="ghost" title="Deletar" onClick={() => handleDelete(acao)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isCreating ? "Nova Ação" : "Editar Ação"}
            </DialogTitle>
            <DialogDescription className="text-blue-200">
              {isCreating
                ? "Preencha os dados para criar uma nova ação."
                : "Edite os dados da ação automatizada."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex flex-col gap-4 mt-4"
          >
            {isCreating && (
              <div>
                <Label htmlFor="etapa" className="text-blue-100">
                  Etapa
                </Label>
                <Input
                  id="etapa"
                  value={editingAcao?.etapa || ""}
                  onChange={(e) =>
                    setEditingAcao((prev) => prev && { ...prev, etapa: e.target.value })
                  }
                  required
                  className="bg-slate-800 border-white/10 text-white"
                />
              </div>
            )}
            <div>
              <Label htmlFor="opcao" className="text-blue-100">
                Opção
              </Label>
              <Input
                id="opcao"
                value={editingAcao?.opcao || ""}
                onChange={(e) =>
                  setEditingAcao((prev) => prev && { ...prev, opcao: e.target.value })
                }
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="acao_tipo" className="text-blue-100">
                Tipo de Ação
              </Label>
              <Input
                id="acao_tipo"
                value={editingAcao?.acao_tipo || ""}
                onChange={(e) =>
                  setEditingAcao((prev) => prev && { ...prev, acao_tipo: e.target.value })
                }
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="conteudo" className="text-blue-100">
                Conteúdo
              </Label>
              <Textarea
                id="conteudo"
                value={editingAcao?.conteudo || ""}
                onChange={(e) =>
                  setEditingAcao((prev) => prev && { ...prev, conteudo: e.target.value })
                }
                required
                className="bg-slate-800 border-white/10 text-white"
              />
            </div>
            <DialogFooter className="mt-2 flex gap-2">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="text-blue-200"
              >
                Cancelar
              </Button>
            </DialogFooter>
            {saveSuccess === true && (
              <div className="flex items-center gap-2 text-green-400 mt-2">
                <CheckCircle className="h-4 w-4" /> Salvo com sucesso!
              </div>
            )}
            {saveSuccess === false && (
              <div className="flex items-center gap-2 text-red-400 mt-2">
                <AlertCircle className="h-4 w-4" /> Erro ao salvar.
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 