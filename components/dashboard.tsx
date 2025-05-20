"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import SystemMessages from "@/components/system-messages";
import TransferDestinations from "@/components/transfer-destinations";
import MenusManager from "@/components/menus-manager";
import FlowEditor from "@/components/flow-editor";

export default function Dashboard() {
  const [activeContent, setActiveContent] = useState("fluxo");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [key, setKey] = useState(0); // Para forçar reanimação quando o mesmo conteúdo for selecionado

  // Função para mudar o conteúdo com reanimação
  const changeContent = (content: string) => {
    if (content === activeContent) {
      setKey((prev) => prev + 1); // Força reanimação
    } else {
      setActiveContent(content);
    }
  };

  const renderContent = () => {
    switch (activeContent) {
      case "fluxo":
        return <FlowEditor />;
      case "mensagens":
        return <SystemMessages />;
      case "whatsapp":
        return <TransferDestinations />;
      case "menus":
        return <MenusManager />;
      default:
        return <div>Selecione uma opção no menu</div>;
    }
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar>
          <SidebarHeader className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Atendente virtual</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Fechar Sidebar</span>
              </Button>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeContent === "fluxo"}
                      onClick={() => changeContent("fluxo")}
                      className="text-sidebar-foreground hover:text-sidebar-foreground"
                    >
                      <button>
                        <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden">
                          <img
                            src="/images/quebra-cabeca.png"
                            alt="Fluxo de atendimento"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <span>Fluxo de atendimento</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeContent === "menus"}
                      onClick={() => changeContent("menus")}
                      className="text-sidebar-foreground hover:text-sidebar-foreground"
                    >
                      <button>
                        <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden">
                          <img
                            src="/images/menu.png"
                            alt="Menus"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <span>Menus</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className="text-sidebar-foreground hover:text-sidebar-foreground"
                    >
                      <button>
                        <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden">
                          <img
                            src="/images/engrenagem.png"
                            alt="Configuração"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <span>Configuração</span>
                        <Badge variant="destructive" className="ml-auto">
                          OFF
                        </Badge>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Comunicação</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeContent === "mensagens"}
                      onClick={() => changeContent("mensagens")}
                      className="text-sidebar-foreground hover:text-sidebar-foreground"
                    >
                      <button>
                        <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden">
                          <img
                            src="/images/balao.png"
                            alt="Mensagens"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <span>Mensagens</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={activeContent === "whatsapp"}
                      onClick={() => changeContent("whatsapp")}
                      className="text-sidebar-foreground hover:text-sidebar-foreground"
                    >
                      <button>
                        <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden">
                          <img
                            src="/images/whatsapp.png"
                            alt="Destinos de transferência"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <span>Destinos de transferência</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                A
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Admin</span>
                <span className="text-xs text-muted-foreground">
                  admin@edusystem.com
                </span>
              </div>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <div className="flex h-full flex-col">
            {!sidebarOpen && (
              <div className="p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(true)}
                >
                  <PanelLeft className="h-4 w-4" />
                  <span className="sr-only">Abrir barra lateral</span>
                </Button>
              </div>
            )}
            <main className="flex-1 overflow-auto p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeContent}-${key}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="h-full w-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
