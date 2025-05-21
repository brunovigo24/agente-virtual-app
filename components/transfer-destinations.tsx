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
import { Edit, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Destino = {
  id: string;
  titulo: string;
  numero: string;
  descricao?: string;
};

export default function TransferDestinations() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDestino, setEditingDestino] = useState<Destino | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);

  // Função utilitária para requisições autenticadas
  function getAuthHeaders() {
    const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  useEffect(() => {
    fetchDestinos();
  }, []);

  const fetchDestinos = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:3000/api/destinos", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar destinos");
      const data = await response.json();

      const destinosArray = Object.entries(data).map(
        ([id, info]: [string, any]) => {
          const titulo = id
            .replace(/_menu$/, "")
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .replace(/([a-z])([A-Z])/g, "$1 $2");

          return {
            id,
            titulo,
            numero: typeof info === "string" ? info : info.numero || "",
            descricao:
              typeof info === "object" && info.descricao ? info.descricao : "",
          };
        }
      );

      setDestinos(destinosArray);
    } catch (err) {
      setError(
        "Não foi possível carregar os destinos de transferência. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDestinoById = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/destinos/${id}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar destino");
      const data = await response.json();
      return {
        id,
        titulo: id
          .replace(/_menu$/, "")
          .replace(/_/g, " ")
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .replace(/([a-z])([A-Z])/g, "$1 $2"),
        numero: data.numero || data.conteudo || "",
        descricao: data.descricao || "",
      };
    } catch {
      return null;
    }
  };

  // Formatar o número enquanto digita
  function formatPhoneNumber(value: string) {

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
  }

  // Extrair apenas os dígitos do número formatado
  function getOnlyDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  // Validar se o número tem código de país e DDD
  function isValidPhoneNumber(value: string) {
    const digits = getOnlyDigits(value);
    // Deve ter pelo menos 13 dígitos: 2 (país) + 2 (DDD) + 9 (número)
    return digits.length >= 13;
  }

  const handleEdit = async (destino: Destino) => {
    setSaveSuccess(null);
    setIsDialogOpen(true);
    const apiDestino = await fetchDestinoById(destino.id);
    setEditingDestino(apiDestino || destino);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    inputValue = getOnlyDigits(inputValue);
    // Formata o número enquanto digita
    setEditingDestino((prev) =>
      prev
        ? {
            ...prev,
            numero: formatPhoneNumber(inputValue),
          }
        : null
    );
  };

  const handleSave = async () => {
    if (!editingDestino) return;

    if (!isValidPhoneNumber(editingDestino.numero)) {
      toast({
        title: "Número inválido",
        description:
          "Inclua o código do país (ex: 55) e o DDD (ex: 44) no número.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setSaveSuccess(null);

    try {
      const numeroSomenteDigitos = getOnlyDigits(editingDestino.numero);

      const response = await fetch(
        `http://localhost:3000/api/destinos/${editingDestino.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ conteudo: numeroSomenteDigitos }),
        }
      );

      if (!response.ok) throw new Error("Erro ao salvar destino");

      setDestinos(
        destinos.map((dest) =>
          dest.id === editingDestino.id
            ? { ...editingDestino, numero: formatPhoneNumber(numeroSomenteDigitos) }
            : dest
        )
      );
      setSaveSuccess(true);
      toast({
        title: "Destino atualizado",
        description: `O número para "${editingDestino.titulo}" foi atualizado com sucesso.`,
      });

      setTimeout(() => {
        setIsDialogOpen(false);
        setEditingDestino(null);
      }, 1000);
    } catch (err) {
      setSaveSuccess(false);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o destino.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando destinos de transferência...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="transfer-destinations">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Destinos de Transferência</h2>
          <p className="text-muted-foreground">
            Configure os números para onde as transferências serão encaminhadas.
          </p>
        </div>
        <Button onClick={fetchDestinos} variant="outline">
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {destinos.map((destino) => (
          <Card key={destino.id} className="p-4 shadow-md">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{destino.titulo}</h3>
                  <Badge variant="outline">{destino.id}</Badge>
                </div>
                <div className="flex items-center text-primary mb-1">
                  <img
                    src="/images/whatsapp.png"
                    alt="WhatsApp"
                    className="h-5 w-5 mr-2"
                  />
                  <span className="font-medium">{destino.numero}</span>
                </div>
                {destino.descricao && (
                  <div className="text-sm text-muted-foreground">
                    {destino.descricao}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(destino)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Destino de Transferência</DialogTitle>
            <DialogDescription>
              Atualize o número de telefone/WhatsApp para "
              {editingDestino?.titulo}".
            </DialogDescription>
          </DialogHeader>

          {editingDestino && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="numero">Número de telefone/WhatsApp</Label>
                <div className="flex items-center">
                  <img
                    src="/images/whatsapp.png"
                    alt="WhatsApp"
                    className="h-5 w-5 mr-2"
                  />
                  <Input
                    id="numero"
                    value={editingDestino.numero}
                    onChange={handleInputChange}
                    placeholder="+55 (44) 00000-0000"
                    inputMode="numeric"
                    pattern="\+?\d*"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Formato recomendado: +55 (44) 00000-0000
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
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
  );
}
