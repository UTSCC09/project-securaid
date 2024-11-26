"use client";

import clsx from "clsx";
import createGlobe, { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef, useState } from "react";

export const cn = clsx;

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0.8,  // Adds darkness to the globe for a more space-like feel
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 4,

  // Dark Grey/Black Globe
  baseColor: [0.1, 0.1, 0.1],  // Dark grey (can adjust to [0, 0, 0] for black)

  // Orange Glow
  glowColor: [1, 0.4, 0],  // Orange glow

  // Keep marker colors as you had them before, or adjust if needed
  markerColor: [251 / 255, 100 / 255, 21 / 255],  // Orange marker color

  markers: [
    { location: [14.5995, 120.9842], size: 0.03 },  // Manila, Philippines
    { location: [19.076, 72.8777], size: 0.1 },     // Mumbai, India
    { location: [23.8103, 90.4125], size: 0.05 },   // Dhaka, Bangladesh
    { location: [30.0444, 31.2357], size: 0.07 },   // Cairo, Egypt
    { location: [39.9042, 116.4074], size: 0.08 },  // Beijing, China
    { location: [-23.5505, -46.6333], size: 0.1 },  // São Paulo, Brazil
    { location: [19.4326, -99.1332], size: 0.1 },   // Mexico City, Mexico
    { location: [40.7128, -74.006], size: 0.1 },    // New York City, USA
    { location: [34.6937, 135.5022], size: 0.05 },  // Osaka, Japan
    { location: [41.0082, 28.9784], size: 0.06 },   // Istanbul, Turkey
    
    // Additional markers:
    { location: [48.8566, 2.3522], size: 0.08 },    // Paris, France
    { location: [51.5074, -0.1278], size: 0.09 },   // London, UK
    { location: [55.7558, 37.6173], size: 0.07 },   // Moscow, Russia
    { location: [-33.8688, 151.2093], size: 0.06 }, // Sydney, Australia
    { location: [34.0522, -118.2437], size: 0.1 },  // Los Angeles, USA
    { location: [52.5200, 13.4050], size: 0.08 },   // Berlin, Germany
    { location: [40.7306, -73.9352], size: 0.05 },  // Brooklyn, USA
    { location: [37.7749, -122.4194], size: 0.1 },  // San Francisco, USA
    { location: [55.6761, 12.5683], size: 0.05 },   // Copenhagen, Denmark
    { location: [35.6762, 139.6503], size: 0.1 },   // Tokyo, Japan
  ],
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  let phi = 0;
  let width = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  const [r, setR] = useState(0);

  const updatePointerInteraction = (value: any) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: any) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      setR(delta / 200);
    }
  };

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phi += 0.005;
      state.phi = phi + r;
      state.width = width * 2;
      state.height = width * 2;
    },
    [r],
  );

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender,
    });

    setTimeout(() => (canvasRef.current!.style.opacity = "1"));
    return () => globe.destroy();
  }, []);

  return (
    <div
      className={cn(
        "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]",
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}

export default Globe;
