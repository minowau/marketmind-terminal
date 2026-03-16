import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar, AppHeader } from "@/components/AppLayout";
import { AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import NewsPage from "./pages/NewsPage";
import SignalsPage from "./pages/SignalsPage";
import SimulationPage from "./pages/SimulationPage";
import StockDetailPage from "./pages/StockDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 ml-[200px] flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-1">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/news" element={<NewsPage />} />
                  <Route path="/signals" element={<SignalsPage />} />
                  <Route path="/simulation" element={<SimulationPage />} />
                  <Route path="/stock/:symbol" element={<StockDetailPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
