import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool } from 'lucide-react';

/**
 * Quiet Luxury Silk Cream Touch/Pointer Signature Pad for LUMINA // BEAUTY & SALON
 * Supports touch, stylus, and mouse with retina DPR scaling and immediate stroke capture.
 */
const SignaturePad = ({ onChange, onClear, existingSignature = null }) => {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const initializedRef = useRef(false);
  const lastEmittedRef = useRef(null);
  const sizeRef = useRef({ width: 460, height: 150 });
  const [hasDrawn, setHasDrawn] = useState(Boolean(existingSignature));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Never reset or re-rasterize the canvas when the parent echoes back our own stroke
    if (existingSignature && existingSignature === lastEmittedRef.current && initializedRef.current) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!initializedRef.current) {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(280, Math.round(rect.width || 460));
      const height = Math.max(140, Math.round(rect.height || 150));
      const dpr = Math.min(window.devicePixelRatio || 2, 2);
      sizeRef.current = { width, height };
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = '#2A201D';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      initializedRef.current = true;
    }

    const { width, height } = sizeRef.current;

    if (existingSignature) {
      let cancelled = false;
      const img = new Image();
      img.onload = () => {
        if (cancelled || drawingRef.current) return;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawn(true);
      };
      img.src = existingSignature;
      return () => {
        cancelled = true;
      };
    } else if (lastEmittedRef.current === null || !drawingRef.current) {
      ctx.clearRect(0, 0, width, height);
      lastEmittedRef.current = null;
      setHasDrawn(false);
    }
  }, [existingSignature]);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? sizeRef.current.width / rect.width : 1;
    const scaleY = rect.height ? sizeRef.current.height / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    const { x, y } = getCoords(e);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    drawingRef.current = true;
    setHasDrawn(true);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getCoords(e);
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const finishStroke = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && typeof onChange === 'function') {
      const dataUrl = canvas.toDataURL('image/png');
      lastEmittedRef.current = dataUrl;
      onChange(dataUrl);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, sizeRef.current.width, sizeRef.current.height);
    drawingRef.current = false;
    lastEmittedRef.current = null;
    setHasDrawn(false);
    onChange?.(null);
    onClear?.();
  };

  return (
    <div className="space-y-2.5">
      <div className="relative border-2 border-dashed border-[#DFC7B8] hover:border-[#C87A72] rounded-2xl bg-[#FAF6F2] overflow-hidden touch-none transition-colors">
        <canvas
          ref={canvasRef}
          className="w-full h-36 sm:h-40 cursor-crosshair block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
          onPointerCancel={finishStroke}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#9A847D] text-xs gap-2">
            <PenTool size={15} className="text-[#C87A72]" />
            <span>Firma aquí con el dedo, lápiz táctil o ratón</span>
          </div>
        )}

        <div className="absolute bottom-2 right-3 pointer-events-none text-[9px] uppercase tracking-widest text-[#C59B5F] font-bold">
          Firma Digital RGPD
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E9D9CF] text-[#6E5A54] hover:text-[#2A201D] font-bold cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Limpiar firma</span>
        </button>

        {hasDrawn && (
          <span className="text-[11px] font-bold text-[#5C8A74]">
            ✓ Trazo capturado
          </span>
        )}
      </div>
    </div>
  );
};

export default SignaturePad;
