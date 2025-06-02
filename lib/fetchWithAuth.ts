"use client";

import { useRouter, usePathname } from "next/navigation";

export function useFetchWithAuth() {
  const router = useRouter();
  const pathname = usePathname();

  return async (input: RequestInfo, init?: RequestInit) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const headers = {
        ...(init?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(input, { ...init, headers });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("authToken");
        if (pathname !== "/login") {
          router.push("/login");
        }
        return null;
      }

      if (!response.ok) {
        throw new Error("Erro na requisição");
      }

      return response;
    } catch (error) {
      // Se for erro de rede (API offline)
      if (pathname !== "/login") {
        router.push("/login");
      }
      return null;
    }
  };
} 