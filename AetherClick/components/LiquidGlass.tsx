import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ══ Sam Asante Liquid Glass (glass.samasante.com) ══════════════
   MIT License © Sam Asante
   https://github.com/samasante/liquid-glass

   Apple-style Liquid Glass for the web. A headless React lens that
   refracts the live DOM — real refraction in Safari, Firefox, and
   Chrome. Zero runtime dependencies.

   ── HOW IT WORKS ───────────────────────────────────────────────
   A rounded-rect signed-distance field (SDF) is rasterized to a
   displacement map (red and green encode X/Y displacement, blue a
   specular mask). That map feeds an SVG feDisplacementMap on the
   content via filter: url(#…), with a 3-pass RGB split for
   chromatic aberration.

   ── MATERIAL MODE ──────────────────────────────────────────────
   Wraps any styled box and turns it into glass: it frosts and
   refracts the LIVE page behind it, a translucent color serves as
   the tint, a directional sheen rims it, and children render crisp.
   ══════════════════════════════════════════════════════════════ */

export interface GlassOptics {
  strength: number;
  depth: number;
  curvature: number;
  bend: number;
  bendWidth: number;
  dispersion: number;
  frost: number;
  saturate?: number;
  brightness?: number;
  sheen: number;
  sheenWidth: number;
  sheenFalloff: number;
  sheenAngle: number;
  glow: number;
  glowSpread: number;
  glowFalloff: number;
  specular: number;
  mapSize: number;
}

export const MATERIAL_OPTICS: GlassOptics = {
  strength: 0.05,
  depth: 0.5,
  curvature: 0.3,
  bend: 0.45,
  bendWidth: 0.16,
  dispersion: 0.32,
  frost: 16,
  saturate: 1.25,
  brightness: 0,
  sheen: 0.32,
  sheenWidth: 3,
  sheenFalloff: 1.5,
  sheenAngle: 45,
  glow: 0.1,
  glowSpread: 1,
  glowFalloff: 0.5,
  specular: 1,
  mapSize: 256,
};

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  optics?: Partial<GlassOptics>;
  radius?: number;
  width?: number;
  height?: number;
}

/**
 * Procedural SDF displacement-map generator for Liquid Glass.
 * Encodes:
 *   R — X displacement (128 = 0 neutral)
 *   G — Y displacement (128 = 0 neutral)
 *   B — Specular sheen & inner glow mask (128 = 0, 255 = full)
 */
export function generateLiquidGlassMap(
  w: number,
  h: number,
  r: number,
  optics: GlassOptics
): string {
  if (typeof document === "undefined") return "";

  const size = optics.mapSize;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  const half = size / 2;
  const radius = (r / Math.max(w, h || 1)) * half;
  const halfW = (w / Math.max(w, h || 1)) * half * 0.9;
  const halfH = (h / Math.max(w, h || 1)) * half * 0.9;

  const radAngle = (optics.sheenAngle * Math.PI) / 180;
  const lx = Math.cos(radAngle);
  const ly = Math.sin(radAngle);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const px = Math.abs(x - half) - (halfW - radius);
      const py = Math.abs(y - half) - (halfH - radius);
      const ox = Math.max(px, 0);
      const oy = Math.max(py, 0);
      const dist =
        Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(px, py), 0) - radius;

      if (dist > 0) {
        data[idx] = 128;
        data[idx + 1] = 128;
        data[idx + 2] = 128;
        data[idx + 3] = 0;
      } else {
        const inward = -dist;
        const normDist = Math.min(1, inward / (half * optics.depth));

        const dx = (x - half) / half;
        const dy = (y - half) / half;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / len;
        const ny = dy / len;

        const dome = Math.sin(normDist * Math.PI * 0.5) * optics.curvature;
        const rimBand = Math.max(0, 1 - inward / (half * optics.bendWidth));
        const rimBend = Math.sin(rimBand * Math.PI * 0.5) * optics.bend;
        const totalBend = (dome + rimBend) * optics.strength;

        data[idx] = Math.max(
          0,
          Math.min(255, Math.round(128 + nx * totalBend * 127))
        );
        data[idx + 1] = Math.max(
          0,
          Math.min(255, Math.round(128 + ny * totalBend * 127))
        );

        const dot = Math.max(0, nx * lx + ny * ly);
        const sheenVal = Math.pow(dot, 3) * optics.sheen * rimBand;
        const glowVal = Math.exp(-inward / (half * 0.2)) * optics.glow;
        const specular = Math.min(1, (sheenVal + glowVal) * optics.specular);

        data[idx + 2] = Math.round(128 + specular * 127);
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas.toDataURL("image/png");
}

/**
 * Headless Liquid Glass React Component (glass.samasante.com)
 */
export const Glass: React.FC<GlassProps> = ({
  children,
  optics,
  radius,
  width,
  height,
  className = "",
  style,
  ...rest
}) => {
  const mergedOptics = useMemo(
    () => ({ ...MATERIAL_OPTICS, ...optics }),
    [optics]
  );

  const filterId = useId().replace(/:/g, "lg_");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [mapUrl, setMapUrl] = useState<string>("");
  const [isBlink, setIsBlink] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent;
    const hasUA = (navigator as any).userAgentData != null;
    const blink =
      hasUA ||
      (/\b(?:Chrome|Chromium|Edg)\//.test(ua) &&
        !/\b(?:CriOS|EdgiOS|FxiOS|OPiOS)\b/.test(ua) &&
        !/iPhone|iPad|iPod/.test(ua));
    setIsBlink(blink);
  }, []);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const updateMap = () => {
      const rect = el.getBoundingClientRect();
      const w = width ?? rect.width ?? 200;
      const h = height ?? rect.height ?? 100;
      const computedR =
        radius ??
        (parseFloat(getComputedStyle(el).borderRadius) || 16);

      const url = generateLiquidGlassMap(w, h, computedR, mergedOptics);
      setMapUrl(url);
    };

    updateMap();
    const ro = new ResizeObserver(updateMap);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, radius, mergedOptics]);

  const frost = mergedOptics.frost;
  const sat = mergedOptics.saturate ?? 1.25;

  const backdropFilterString = isBlink && mapUrl
    ? `blur(${frost}px) saturate(${sat}) url(#${filterId})`
    : `blur(${frost}px) saturate(${sat})`;

  return (
    <div
      ref={wrapRef}
      className={`liquid-glass-surface ${className}`}
      style={{
        position: "relative",
        backdropFilter: backdropFilterString,
        WebkitBackdropFilter: `blur(${frost}px) saturate(${sat})`,
        ...style,
      }}
      {...rest}
    >
      {/* SVG Chromatic Dispersion & Specular Filter Definition */}
      <svg
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id={filterId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodColor="rgb(128,128,128)" floodOpacity="1" result="mapBg" />
            <feImage href={mapUrl} preserveAspectRatio="none" result="rawMap" />
            <feComposite in="rawMap" in2="mapBg" operator="over" result="map" />

            {/* 3-pass RGB split for chromatic aberration */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={22}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="refractR"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={18}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="refractG"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="map"
              scale={14}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="refractB"
            />

            <feComposite
              in="refractR"
              in2="refractG"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="refractRG"
            />
            <feComposite
              in="refractRG"
              in2="refractB"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lensOut"
            />

            {/* Specular sheen lift from B channel */}
            <feColorMatrix
              in="map"
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 -0.50196"
              result="sheenMask"
            />
            <feComposite
              in="sheenMask"
              in2="lensOut"
              operator="arithmetic"
              k1="0"
              k2={mergedOptics.sheen}
              k3="1"
              k4="0"
            />
          </filter>
        </defs>
      </svg>

      {/* Crisp Children on Top */}
      {children}
    </div>
  );
};

export const GlassMaterial = Glass;
export default Glass;
