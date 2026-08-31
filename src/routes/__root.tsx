import { Outlet, createRootRoute } from "@tanstack/react-router";

import "../styles.css";
import { StoreProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <StoreProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </StoreProvider>
  );
}
