"use client";

// Zone de signature manuscrite (souris, doigt ou stylet) sans dépendance :
// un <canvas> et les pointer events. `onChange` reçoit le PNG en data URL,
// ou null quand la zone est vide.

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
}

const STROKE_COLOR = "#1a1a1a";
const STROKE_WIDTH = 2.2;

export function SignaturePad({ onChange, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Le canvas est dimensionné en pixels physiques pour rester net sur les
  // écrans haute densité, puis remis à l'échelle CSS.
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width === Math.round(width * ratio)) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = STROKE_WIDTH;
    ctx.strokeStyle = STROKE_COLOR;
    setIsEmpty(true);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    // Un simple point compte comme un trait.
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    setIsEmpty(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointFromEvent(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onChange(e.currentTarget.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Zone de signature"
          className={`w-full h-40 bg-white border border-noir/20 touch-none ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-crosshair"
          }`}
        />
        {isEmpty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gris-moyen">
            Signez ici avec la souris ou le doigt
          </span>
        )}
        {/* Ligne de signature */}
        <span className="pointer-events-none absolute left-6 right-6 bottom-8 border-t border-dashed border-noir/20" />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={clear}
        disabled={disabled || isEmpty}
        className="h-8 px-2 text-gris-moyen"
      >
        <Eraser className="h-4 w-4 mr-1" />
        Effacer
      </Button>
    </div>
  );
}

export default SignaturePad;
