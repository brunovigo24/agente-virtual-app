"use client";

import { useState, useEffect, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Save, Loader2, CheckCircle, AlertCircle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFetchWithAuth } from "@/lib/fetchWithAuth";
import { API_BASE_URL } from "@/lib/apiBaseUrl"

// Tipo da ação automatizada
export type Acao = {
  id: string;
  etapa: string;
  opcao: string;
  acao_tipo: string;
  conteudo: string;
  aguarda_resposta?: boolean;
};

type MenuItem = {
  id: string;
  titulo: string;
  descricao: string;
  opcoes: Array<{ id: string; titulo: string }>;
  ativo?: boolean;
};

// Constantes para validação de arquivos
const MAX_ARQUIVOS = 5;
const MAX_TAMANHO_ARQUIVO = 10 * 1024 * 1024; // 10MB em bytes
const TIPOS_ACEITOS = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

// Função para formatar tamanho do arquivo
function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Função para validar arquivo
function validarArquivo(arquivo: File): { valido: boolean; erro?: string } {
  if (arquivo.size > MAX_TAMANHO_ARQUIVO) {
    return { valido: false, erro: `Arquivo muito grande (máximo ${formatarTamanhoArquivo(MAX_TAMANHO_ARQUIVO)})` };
  }
  
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    return { valido: false, erro: 'Tipo de arquivo não suportado' };
  }
  
  return { valido: true };
}

export default function AcoesAutomatizadas() {
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAcao, setEditingAcao] = useState<Acao | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arquivosInvalidos, setArquivosInvalidos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [acaoParaDeletar, setAcaoParaDeletar] = useState<Acao | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isMenusLoading, setIsMenusLoading] = useState(false);
  const [menusError, setMenusError] = useState<string | null>(null);
  const fetchWithAuth = useFetchWithAuth();

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
      const response = await fetchWithAuth(`${API_BASE_URL}/api/acoes?incluirArquivos=true`, {
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!response) return;
      const data = await response.json();
      setAcoes(data);
    } catch (err) {
      setError("Não foi possível carregar as ações. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar menus ao abrir modal de criação
  const fetchMenus = async () => {
    setIsMenusLoading(true);
    setMenusError(null);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/menus`, {
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!response) return;
      const data = await response.json();

      const menusArray = Object.entries(data).map(
        ([id, menu]: [string, any]) => ({ id, ...menu })
      );
      setMenus(menusArray);
    } catch (err) {
      setMenusError("Não foi possível carregar os menus.");
    } finally {
      setIsMenusLoading(false);
    }
  };

  const handleEdit = (acao: Acao) => {
    setEditingAcao(acao);
    setIsDialogOpen(true);
    setSaveSuccess(null);
    setIsCreating(false);
    setArquivos([]);
    setArquivosInvalidos([]);
  };

  const handleCreate = () => {
    setEditingAcao({ id: "", etapa: "", opcao: "", acao_tipo: "mensagem", conteudo: "", aguarda_resposta: false });
    setIsDialogOpen(true);
    setSaveSuccess(null);
    setIsCreating(true);
    setArquivos([]);
    setArquivosInvalidos([]);
    fetchMenus(); 
  };

  const handleDelete = async (acao: Acao) => {
    setAcaoParaDeletar(acao);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!acaoParaDeletar) return;
    try {
      // 1. Deletar a ação
      const response = await fetchWithAuth(`${API_BASE_URL}/api/acoes/${acaoParaDeletar.id}`, {
        method: "DELETE",
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!response) return;

      // 2. Buscar o fluxo atual para mapear a opção
      const fluxoResponse = await fetchWithAuth(`${API_BASE_URL}/api/fluxo`, {
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!fluxoResponse) return;
      const fluxoAtual = await fluxoResponse.json();

      // 3. Mapear a opção para o seu valor no fluxo
      const etapaNoFluxo = fluxoAtual[acaoParaDeletar.etapa];
      if (etapaNoFluxo) {
        const opcaoMapeada = etapaNoFluxo[acaoParaDeletar.opcao];
        if (opcaoMapeada) {
          // 4. Remover a opção mapeada do fluxo
          const etapasAtualizadas = (fluxoAtual.etapasAjudoEmMaisInformacoes || []).filter(
            (etapa: string) => etapa !== opcaoMapeada
          );

          // 5. Enviar o array atualizado
          const fluxoUpdateResponse = await fetchWithAuth(
            `${API_BASE_URL}/api/fluxo/etapasAjudoEmMaisInformacoes`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...(getAuthHeaders() as HeadersInit),
              },
              body: JSON.stringify(etapasAtualizadas),
            }
          );
          if (!fluxoUpdateResponse) return;
        }
      }

      // 6. Atualizar a lista de ações
      const acoesResponse = await fetchWithAuth(`${API_BASE_URL}/api/acoes?incluirArquivos=true`, {
        headers: getAuthHeaders() as HeadersInit,
      });
      if (!acoesResponse) return;
      const acoes = await acoesResponse.json();
      setAcoes(acoes.filter((a: Acao) => a.id !== acaoParaDeletar.id));
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
    } finally {
      setIsDeleteDialogOpen(false);
      setAcaoParaDeletar(null);
    }
  };

  const handleSave = async () => {
    if (!editingAcao) return;
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      let response;
      if ((isCreating && editingAcao.acao_tipo === "arquivo") || (!isCreating && editingAcao.acao_tipo === "arquivo" && arquivos.length > 0)) {
        const formData = new FormData();
        if (isCreating) {
          formData.append("etapa", editingAcao.etapa);
        }
        formData.append("opcao", editingAcao.opcao);
        formData.append("acao_tipo", editingAcao.acao_tipo);
        formData.append("conteudo", editingAcao.conteudo);
        if (Boolean(editingAcao.aguarda_resposta)) {
          formData.append("aguarda_resposta", "true");
        }
        // Adicionar múltiplos arquivos
        arquivos.forEach(arquivo => {
          formData.append("arquivos", arquivo);
        });
        response = await fetchWithAuth(isCreating ? `${API_BASE_URL}/api/acoes` : `${API_BASE_URL}/api/acoes/${editingAcao.id}`, {
          method: isCreating ? "POST" : "PUT",
          headers: {
            ...(getAuthHeaders() as HeadersInit),
          },
          body: formData,
        });
      } else {
        response = await fetchWithAuth(isCreating ? `${API_BASE_URL}/api/acoes` : `${API_BASE_URL}/api/acoes/${editingAcao.id}`, {
          method: isCreating ? "POST" : "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(getAuthHeaders() as HeadersInit),
          },
          body: JSON.stringify(isCreating ? {
            etapa: editingAcao.etapa,
            opcao: editingAcao.opcao,
            acao_tipo: editingAcao.acao_tipo,
            conteudo: editingAcao.conteudo,
            ...(Boolean(editingAcao.aguarda_resposta) && { aguarda_resposta: true }),
          } : {
            opcao: editingAcao.opcao,
            acao_tipo: editingAcao.acao_tipo,
            conteudo: editingAcao.conteudo,
            ...(Boolean(editingAcao.aguarda_resposta) && { aguarda_resposta: true }),
          }),
        });
      }
      if (!response) return;
      
      // Atualizar o fluxo se for uma nova ação
      if (isCreating) {
        // 1. Buscar o menu correspondente à etapa para mapear a opção
        const menuSelecionado = menus.find((menu) => menu.id === editingAcao.etapa);
        if (!menuSelecionado) throw new Error("Menu não encontrado");

        // 2. Mapear a opção selecionada para o seu valor no fluxo (ex: "1" → "matriculas_infantil")
        const fluxoResponse = await fetchWithAuth(`${API_BASE_URL}/api/fluxo`, {
          headers: getAuthHeaders() as HeadersInit,
        });
        if (!fluxoResponse) return;
        const fluxoAtual = await fluxoResponse.json();

        const etapaNoFluxo = fluxoAtual[editingAcao.etapa];
        if (!etapaNoFluxo) throw new Error("Etapa não encontrada no fluxo");

        const opcaoMapeada = etapaNoFluxo[editingAcao.opcao];
        if (!opcaoMapeada) throw new Error("Opção não encontrada no fluxo");

        // 3. Adicionar a opção mapeada (evitando duplicatas)
        const etapasAtualizadas = [
          ...(fluxoAtual.etapasAjudoEmMaisInformacoes || []),
          opcaoMapeada,
        ].filter((etapa, index, self) => self.indexOf(etapa) === index);

        // 4. Enviar o array atualizado
        const fluxoUpdateResponse = await fetchWithAuth(
          `${API_BASE_URL}/api/fluxo/etapasAjudoEmMaisInformacoes`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(getAuthHeaders() as HeadersInit),
            },
            body: JSON.stringify(etapasAtualizadas),
          }
        );
        if (!fluxoUpdateResponse) return;
      }
      
      setSaveSuccess(true);
      setIsDialogOpen(false);
      setEditingAcao(null);
      setArquivos([]);
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

  // Utilitário para converter buffer para URL
  function bufferToUrl(arquivo: any, arquivo_tipo: string) {
    if (!arquivo || !arquivo.data || !arquivo_tipo) return null;
    const byteArray = new Uint8Array(arquivo.data);
    const blob = new Blob([byteArray], { type: arquivo_tipo });
    return URL.createObjectURL(blob);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
    <div className="p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Ações personalizadas</h2>
          <p className="text-blue-200">Gerencie as ações personalizadas do sistema.</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
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
            <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 shadow-xl backdrop-blur-sm bg-white/5 border-white/10 rounded-2xl">
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
                  {Boolean(acao.aguarda_resposta) && (
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-200 text-xs">
                      Aguarda resposta
                    </Badge>
                  )}
                </div>
                <div className="text-white font-medium mt-1">{acao.conteudo}</div>
                {/* Exibe arquivos se for do tipo arquivo */}
                {acao.acao_tipo === "arquivo" && (acao as any).arquivos && Array.isArray((acao as any).arquivos) && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(acao as any).arquivos.map((arquivo: any, index: number) => {
                      const url = bufferToUrl(arquivo.arquivo, arquivo.arquivo_tipo) || '';
                      if (!url) return null;
                      
                      return (
                        <div key={index} className="flex flex-col">
                          {arquivo.arquivo_tipo.startsWith("image/") ? (
                            <img
                              src={url}
                              alt={arquivo.arquivo_nome || `Arquivo ${index + 1}`}
                              className="w-full h-24 object-cover rounded border border-white/10"
                            />
                          ) : arquivo.arquivo_tipo.startsWith("video/") ? (
                            <video
                              src={url}
                              controls
                              className="w-full h-24 rounded border border-white/10"
                            />
                          ) : (
                            <div className="w-full h-24 flex items-center justify-center bg-slate-700 rounded border border-white/10">
                              <span className="text-xs text-blue-300">Arquivo</span>
                            </div>
                          )}
                          <span className="text-xs text-blue-200 mt-1 truncate">
                            {arquivo.arquivo_nome || `Arquivo ${index + 1}`}
                          </span>
                          {!arquivo.arquivo_tipo.startsWith("image/") && !arquivo.arquivo_tipo.startsWith("video/") && (
                            <a
                              href={url}
                              download={arquivo.arquivo_nome || undefined}
                              className="text-xs text-blue-300 underline mt-1"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Baixar
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Fallback para compatibilidade com formato antigo */}
                {acao.acao_tipo === "arquivo" && (acao as any).arquivo && (acao as any).arquivo_tipo && !(acao as any).arquivos && (
                  <div className="mt-2">
                    {(acao as any).arquivo_tipo.startsWith("image/") ? (
                      (() => {
                        const url = bufferToUrl((acao as any).arquivo, (acao as any).arquivo_tipo) || '';
                        return url ? (
                          <img
                            src={url}
                            alt={(acao as any).arquivo_nome || "Arquivo"}
                            className="max-w-xs max-h-48 rounded border border-white/10"
                          />
                        ) : null;
                      })()
                    ) : (acao as any).arquivo_tipo.startsWith("video/") ? (
                      (() => {
                        const url = bufferToUrl((acao as any).arquivo, (acao as any).arquivo_tipo) || '';
                        return url ? (
                          <video
                            src={url}
                            controls
                            className="max-w-xs max-h-48 rounded border border-white/10"
                          />
                        ) : null;
                      })()
                    ) : (
                      (() => {
                        const url = bufferToUrl((acao as any).arquivo, (acao as any).arquivo_tipo) || '';
                        return url ? (
                          <a
                            href={url}
                            download={(acao as any).arquivo_nome || undefined}
                            className="text-blue-300 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Baixar arquivo
                          </a>
                        ) : null;
                      })()
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                <Button size="icon" variant="ghost" title="Editar" onClick={() => handleEdit(acao)} className="rounded-full hover:bg-blue-500/20">
                  <Edit className="h-4 w-4 text-blue-300" />
                </Button>
                <Button size="icon" variant="ghost" title="Deletar" onClick={() => handleDelete(acao)} className="rounded-full hover:bg-red-500/20">
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto backdrop-blur-md bg-white/5 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white-100">
              {isCreating ? "Nova Ação" : "Editar Ação"}
            </DialogTitle>
            <DialogDescription className="text-white-200">
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
            className="flex flex-col gap-4 mt-4 "
          >
            {/* Se for criação, mostrar selects de etapa e opção */}
            {isCreating ? (
              <>
                <div>
                  <Label htmlFor="etapa" className="text-blue-100">
                    Etapa
                  </Label>
                  <Select
                    value={editingAcao?.etapa || ""}
                    onValueChange={(value) => {
                      setEditingAcao((prev) => prev && { ...prev, etapa: value, opcao: "" });
                    }}
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                      <SelectValue placeholder={isMenusLoading ? "Carregando..." : "Selecione o menu"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      {menus.map((menu) => (
                        <SelectItem key={menu.id} value={menu.id}>{menu.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {menusError && <div className="text-red-400 text-xs mt-1">{menusError}</div>}
                </div>
                <div>
                  <Label htmlFor="opcao" className="text-blue-100">
                    Opção
                  </Label>
                  <Select
                    value={editingAcao?.opcao || ""}
                    onValueChange={(value) => {
                      setEditingAcao((prev) => prev && { ...prev, opcao: value });
                    }}
                    disabled={!editingAcao?.etapa}
                  >
                    <SelectTrigger className="bg-slate-800 border-white/10 text-white">
                      <SelectValue placeholder={editingAcao?.etapa ? "Selecione a opção" : "Selecione a etapa primeiro"} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      {menus.find((m) => m.id === editingAcao?.etapa)?.opcoes.map((op) => (
                        <SelectItem key={op.id} value={op.id}>{op.titulo || op.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
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
                    className="bg-slate-800 border-white/10 text-white rounded-2xl"
                    disabled={!isCreating}
                  />
                </div>
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
                    className="bg-slate-800 border-white/10 text-white rounded-2xl"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="acao_tipo" className="text-blue-100">
                Tipo de Ação
              </Label>
              <Select
                value={editingAcao?.acao_tipo || ""}
                onValueChange={(value) => {
                  setEditingAcao((prev) => prev && { ...prev, acao_tipo: value });
                  if (value !== "arquivo") setArquivos([]);
                }}
              >
                <SelectTrigger className="bg-slate-800 border-white/10 text-white rounded-2xl">
                  <SelectValue placeholder="Selecione o tipo de ação" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/10 text-white rounded-2xl">
                  <SelectItem className="rounded-2xl" value="mensagem">Mensagem</SelectItem>
                  <SelectItem className="rounded-2xl" value="link">Link</SelectItem>
                  <SelectItem className="rounded-2xl" value="arquivo">Arquivo</SelectItem>
                  {/*<SelectItem value="transferencia">Transferência</SelectItem>*/}
                </SelectContent>
              </Select>
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
                className="bg-slate-800 border-white/10 text-white rounded-2xl"
                placeholder={editingAcao?.acao_tipo === "arquivo" ? "Ex: Aqui estão as fotos do cardápio! 📸" : "Digite o conteúdo da ação..."}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="aguarda_resposta"
                checked={Boolean(editingAcao?.aguarda_resposta)}
                onCheckedChange={(checked) =>
                  setEditingAcao((prev) => prev && { ...prev, aguarda_resposta: !!checked })
                }
                className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="aguarda_resposta" className="text-blue-100 cursor-pointer">
                Aguardar resposta do usuário
              </Label>
            </div>
            {/* Campo de upload de múltiplos arquivos */}
            {editingAcao?.acao_tipo === "arquivo" && (
              <div>
                <Label htmlFor="arquivos" className="text-blue-100">
                  Arquivos (Máximo {MAX_ARQUIVOS} arquivos, {formatarTamanhoArquivo(MAX_TAMANHO_ARQUIVO)} cada)
                </Label>
                <div className="text-xs text-blue-300 mb-2">
                  Tipos suportados: Imagens (JPG, PNG, GIF), Vídeos (MP4, AVI), Documentos (PDF, DOC, XLS), Texto (TXT, CSV)
                </div>
                <Input
                  id="arquivos"
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  multiple
                  ref={fileInputRef}
                  onChange={e => {
                    const files = Array.from(e.target.files || []);
                    const errosValidacao: string[] = [];
                    const arquivosValidos: File[] = [];
                    
                    // Verificar limite máximo de arquivos
                    if (files.length > MAX_ARQUIVOS) {
                      errosValidacao.push(`Máximo ${MAX_ARQUIVOS} arquivos permitidos`);
                      return;
                    }
                    
                    // Validar cada arquivo
                    files.forEach((arquivo, index) => {
                      const validacao = validarArquivo(arquivo);
                      if (validacao.valido) {
                        arquivosValidos.push(arquivo);
                      } else {
                        errosValidacao.push(`${arquivo.name}: ${validacao.erro}`);
                      }
                    });
                    
                    setArquivos(arquivosValidos);
                    setArquivosInvalidos(errosValidacao);
                    
                                         if (errosValidacao.length > 0) {
                       toast({
                         title: "Alguns arquivos não foram aceitos",
                         description: errosValidacao.join(', '),
                         open: true,
                       });
                     }
                  }}
                  className="bg-slate-800 border-white/10 text-white rounded-2xl"
                />
                
                {/* Exibe erros de validação */}
                {arquivosInvalidos.length > 0 && (
                  <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded text-xs">
                    <div className="text-red-300 font-semibold mb-1">Arquivos rejeitados:</div>
                    {arquivosInvalidos.map((erro, index) => (
                      <div key={index} className="text-red-200">• {erro}</div>
                    ))}
                  </div>
                )}
                
                {/* Exibe arquivos selecionados */}
                {arquivos.length > 0 && (
                  <div className="mt-2">
                    <div className="text-blue-200 text-xs mb-2 flex items-center justify-between">
                      <span>Arquivos selecionados ({arquivos.length}/{MAX_ARQUIVOS}):</span>
                      <span className="text-green-300">
                        Total: {formatarTamanhoArquivo(arquivos.reduce((sum, file) => sum + file.size, 0))}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {arquivos.map((arquivo, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded text-xs">
                          <div className="flex-1 min-w-0">
                            <div className="text-blue-200 truncate font-medium">{arquivo.name}</div>
                            <div className="text-blue-300 flex items-center gap-2">
                              <span>{formatarTamanhoArquivo(arquivo.size)}</span>
                              <span>•</span>
                              <span>{arquivo.type.split('/')[1]?.toUpperCase() || 'Arquivo'}</span>
                              {index === 0 && <span className="text-green-300">(primeira)</span>}
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const novosArquivos = arquivos.filter((_, i) => i !== index);
                              setArquivos(novosArquivos);
                              // Limpar erros se não há mais arquivos
                              if (novosArquivos.length === 0) {
                                setArquivosInvalidos([]);
                              }
                            }}
                            className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-blue-300 mt-2">
                      💡 No WhatsApp: Arquivos serão enviados sequencialmente com numeração automática (1/{arquivos.length}, 2/{arquivos.length}, etc.)
                    </div>
                  </div>
                )}
                
                {/* Exibe arquivos já salvos ao editar */}
                {arquivos.length === 0 && !isCreating && editingAcao && (editingAcao as any).arquivos && Array.isArray((editingAcao as any).arquivos) && (
                  <div className="mt-2">
                    <div className="text-blue-200 text-xs mb-2">Arquivos atuais ({(editingAcao as any).arquivos.length}):</div>
                    <div className="grid grid-cols-1 gap-1">
                      {(editingAcao as any).arquivos.map((arquivo: any, index: number) => (
                        <div key={index} className="text-blue-200 text-xs bg-slate-700 px-2 py-1 rounded flex justify-between">
                          <span>{arquivo.arquivo_nome || `Arquivo ${index + 1}`}</span>
                          <span className="text-blue-300">{arquivo.arquivo_tipo?.split('/')[1]?.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Fallback para compatibilidade com formato antigo */}
                {arquivos.length === 0 && !isCreating && editingAcao && (editingAcao as any).arquivo_nome && !(editingAcao as any).arquivos && (
                  <div className="text-blue-200 text-xs mt-1">
                    Atual: {(editingAcao as any).arquivo_nome}
                    <span className="text-blue-300 ml-2">(formato antigo - um arquivo)</span>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="mt-2 flex gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
                className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white rounded-2xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-2xl"
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
                    Salvar
                  </>
                )}
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

      {/* Modal de confirmação de deleção */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white/5 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white-100">Tem certeza que deseja deletar esta ação?</DialogTitle>
            <DialogDescription className="text-white-200">
              Esta ação não poderá ser desfeita. A ação será removida do sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-white/20 bg-white/5 text-blue-100 hover:bg-white/10 hover:text-white rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmDelete}
              className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-2xl"
            >
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 