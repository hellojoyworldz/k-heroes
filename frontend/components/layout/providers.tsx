"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useAuthMe } from "@/hooks/use-auth-me";

type ProvidersProps = {
  children: ReactNode;
};

function AuthSessionBootstrap() {
  useAuthMe();
  return null;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap />
      {children}
    </QueryClientProvider>
  );
}
