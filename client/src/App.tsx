/** Acoustic Topography shell: the app stays light-themed and floor-first. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import { lazy, Suspense } from "react";
const SpeakerModelValidation = lazy(() => import("./components/SpeakerModelValidation"));

export default function App() {
  const isModelValidation = new URLSearchParams(window.location.search).get("model-lab") === "1";
  return <ErrorBoundary><TooltipProvider><Toaster />{isModelValidation ? <Suspense fallback={null}><SpeakerModelValidation /></Suspense> : <Home />}</TooltipProvider></ErrorBoundary>;
}
