/** Acoustic Topography shell: the app stays light-themed and floor-first. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import SpeakerModelValidation from "./components/SpeakerModelValidation";

export default function App() {
  const isModelValidation = new URLSearchParams(window.location.search).get("model-lab") === "1";
  return <ErrorBoundary><TooltipProvider><Toaster />{isModelValidation ? <SpeakerModelValidation /> : <Home />}</TooltipProvider></ErrorBoundary>;
}
