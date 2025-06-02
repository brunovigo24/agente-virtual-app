"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { LogOut, PanelLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import SystemMessages from "@/components/system-messages";
import TransferDestinations from "@/components/transfer-destinations";
import MenusManager from "@/components/menus-manager";
import WhatsAppInstances from "@/components/whatsapp-instances";
import Image from "next/image";
import AcoesAutomatizadas from "@/components/custom-actions";

export default function Dashboard() {
  const [activeContent, setActiveContent] = useState("menus");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [key, setKey] = useState(0);
  const [username, setUsername] = useState("Admin");
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedUsername = localStorage.getItem("username");
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const changeContent = (content: string) => {
    if (content === activeContent) {
      setKey((prev) => prev + 1);
    } else {
      setActiveContent(content);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login");
  };

  const renderContent = () => {
    switch (activeContent) {
      case "mensagens":
        return <SystemMessages />;
      case "whatsapp":
        return <TransferDestinations />;
      case "menus":
        return <MenusManager />;
      case "instances":
        return <WhatsAppInstances />;
      case "acoes":
        return <AcoesAutomatizadas />;
      default:
        return <div>Selecione uma opção no menu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-blue-950">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar className="backdrop-blur-sm bg-black/30 border-r border-white/10">
            <SidebarHeader className="flex flex-col gap-2 p-4">
              <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-gradient-to-br from-blue-600 to-blue-400 p-1 shadow-lg">
                    <Image
                      src="/images/robo.png"
                      alt="Agente Virtual"
                      width={40}
                      height={40}
                      className="h-full w-full object-contain drop-shadow-md"
                    />
                  </div>
                  <h1 className="text-xl font-bold text-white">
                    Agente Virtual
                  </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelLeft className="h-4 w-4" />
                  <span className="sr-only">Fechar Sidebar</span>
                </Button>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-blue-200 font-medium">
                  Principal
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={activeContent === "menus"}
                        onClick={() => changeContent("menus")}
                        className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-600/20 data-[active=true]:to-blue-500/10 data-[active=true]:border-l-2 data-[active=true]:border-blue-400"
                      >
                        <button>
                          <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-400/20 p-1">
                            <img
                              src="/images/menu.png"
                              alt="Menus"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span>Menus</span>
                          {activeContent === "menus" && (
                            <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-blue-200 font-medium">
                  Comunicação
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={activeContent === "mensagens"}
                        onClick={() => changeContent("mensagens")}
                        className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-600/20 data-[active=true]:to-blue-500/10 data-[active=true]:border-l-2 data-[active=true]:border-blue-400"
                      >
                        <button>
                          <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-400/20 p-1">
                            <img
                              src="/images/balao.png"
                              alt="Mensagens"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span>Mensagens</span>
                          {activeContent === "mensagens" && (
                            <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={activeContent === "acoes"}
                        onClick={() => changeContent("acoes")}
                        className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-600/20 data-[active=true]:to-blue-500/10 data-[active=true]:border-l-2 data-[active=true]:border-blue-400"
                      >
                        <button>
                          <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-400/20 p-1">
                            <img
                              src="/images/engrenagem.png"
                              alt="Ações Personalizadas"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span>Ações personalizadas</span>
                          {activeContent === "acoes" && (
                            <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={activeContent === "whatsapp"}
                        onClick={() => changeContent("whatsapp")}
                        className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-600/20 data-[active=true]:to-blue-500/10 data-[active=true]:border-l-2 data-[active=true]:border-blue-400"
                      >
                        <button>
                          <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-400/20 p-1">
                            <img
                              src="/images/whatsapp.png"
                              alt="Destinos de transferência"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span>Destinos de transferência</span>
                          {activeContent === "whatsapp" && (
                            <ChevronRight className="ml-auto h-4 w-4 text-blue-400" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        isActive={activeContent === "instances"}
                        onClick={() => changeContent("instances")}
                        className="text-white/80 hover:text-white hover:bg-white/10 data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-600/20 data-[active=true]:to-blue-500/10 data-[active=true]:border-l-2 data-[active=true]:border-blue-400"
                      >
                        <button>
                          <div className="flex items-center justify-center h-6 w-6 rounded-md overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-400/20 p-1">
                            <img
                              src="/images/quebra-cabeca.png"
                              alt="Instâncias WhatsApp"
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <span>Instâncias WhatsApp</span>
                          {activeContent === "instances" && (
                            <ChevronRight className="ml-auto h-4 w-4 text-blue-500" />
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {username}
                    </span>
                    <span className="text-xs text-blue-200">
                      admin@admin.com
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sair"
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>

          <SidebarInset className="bg-transparent">
            <div className="flex h-full flex-col">
              {!sidebarOpen && (
                <div className="p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/10 text-white"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <PanelLeft className="h-4 w-4" />
                    <span className="sr-only">Abrir barra lateral</span>
                  </Button>
                </div>
              )}
              <main className="flex-1 overflow-auto p-4">
                <div className="w-full">
                  {renderContent()}
                </div>
              </main>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
