import { useEffect, useRef, useState, useLayoutEffect } from 'react';

interface RevealLayerProps {
  image: string;
  cursorX: number;
  cursorY: number;
  spotlightRadius?: number;
  className?: string;
}

export default function RevealLayer({ 
  image, 
  cursorX, 
  cursorY, 
  spotlightRadius = 260,
  className = "absolute inset-0 z-30"
}: RevealLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update canvas and apply mask on change of cursor or dimensions
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const div = divRef.current;
    if (!canvas || !div) return;

    // Ensure canvas dimensions are sync'd
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Build a radial gradient at (cursorX, cursorY)
    const grad = ctx.createRadialGradient(
      cursorX,
      cursorY,
      0,
      cursorX,
      cursorY,
      spotlightRadius
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(0.75, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.88, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Fill an arc of radius spotlightRadius with it
    ctx.arc(cursorX, cursorY, spotlightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Export canvas to data URL and set as mask image
    try {
      const maskUrl = canvas.toDataURL('image/png');
      div.style.maskImage = `url(${maskUrl})`;
      div.style.webkitMaskImage = `url(${maskUrl})`;
      div.style.maskSize = '100% 100%';
      div.style.webkitMaskSize = '100% 100%';
    } catch (e) {
      console.error("Mask export failed", e);
    }
  }, [cursorX, cursorY, dimensions]);

  return (
    <>
      {/* Hidden canvas per instructions */}
      <canvas
        id="spotlight-canvas"
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ display: 'none' }}
      />
      {/* Reveal div */}
      <div
        id="reveal-layer-div"
        ref={divRef}
        className={`${className} bg-center bg-cover bg-no-repeat pointer-events-none`}
        style={{
          backgroundImage: `url(${image})`,
        }}
      />
    </>
  );
}
