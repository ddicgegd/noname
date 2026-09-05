import React from "react";
import { clsx } from "clsx";

export interface AddToBasketImageHandle {
  getElement: () => HTMLElement | null;
}

export interface AddToBasketTargetHandle {
  getElement: () => HTMLElement | null;
  triggerBounce?: () => void;
}

export interface AddToBasketOptions {
  image: AddToBasketImageHandle | HTMLElement | null;
  basket: AddToBasketTargetHandle | HTMLElement | null;
  duration?: number;
}

export const AddToBasketTarget = React.forwardRef<
  AddToBasketTargetHandle,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const domRef = React.useRef<HTMLDivElement>(null);

  const triggerBounce = React.useCallback(() => {
    if (!domRef.current) return;
    const el = domRef.current;
    // High fidelity iOS / macOS elastic squash & stretch bounce
    el.animate(
      [
        { transform: "translateY(0px) scale(1, 1)" },
        { transform: "translateY(-10px) scale(1.18, 0.88)", offset: 0.25 },
        { transform: "translateY(3px) scale(0.92, 1.08)", offset: 0.52 },
        { transform: "translateY(-4px) scale(1.06, 0.96)", offset: 0.75 },
        { transform: "translateY(1px) scale(0.98, 1.02)", offset: 0.9 },
        { transform: "translateY(0px) scale(1, 1)", offset: 1.0 }
      ],
      {
        duration: 480,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    );
  }, []);

  React.useImperativeHandle(ref, () => ({
    getElement: () => domRef.current,
    triggerBounce,
  }), [triggerBounce]);

  return (
    <div
      ref={domRef}
      className={clsx("transition-transform will-change-transform", className)}
      {...props}
    >
      {children}
    </div>
  );
});
AddToBasketTarget.displayName = "AddToBasketTarget";

export const AddToBasketImage = React.forwardRef<
  AddToBasketImageHandle,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const domRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => ({
    getElement: () => domRef.current,
  }));

  return (
    <div
      ref={domRef}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
});
AddToBasketImage.displayName = "AddToBasketImage";

export interface AddToBasketButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  cooldownMs?: number;
}

export const AddToBasketButton = React.forwardRef<
  HTMLButtonElement,
  AddToBasketButtonProps
>(({ className, children, onClick, disabled, cooldownMs = 500, ...props }, ref) => {
  const [isLocked, setIsLocked] = React.useState(false);
  const lastClickRef = React.useRef<number>(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (isLocked || now - lastClickRef.current < cooldownMs) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    lastClickRef.current = now;
    setIsLocked(true);
    setTimeout(() => setIsLocked(false), cooldownMs);
    onClick?.(e);
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.97] cursor-pointer disabled:pointer-events-none disabled:opacity-50",
        isLocked && "pointer-events-none active:scale-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
AddToBasketButton.displayName = "AddToBasketButton";

// Debounce mutex state to prevent rapid double-clicks
let isBasketAnimating = false;
let lastBasketTriggerTime = 0;
const BASKET_COOLDOWN_MS = 500;

// WebGL High-Fidelity Mesh Constants (Compiz / macOS Genie Engine)
const MESH_ROWS = 64;
const MESH_COLS = 10;
const NUM_VERTICES = (MESH_ROWS + 1) * (MESH_COLS + 1); // 715 vertices
const NUM_QUADS = MESH_ROWS * MESH_COLS; // 640 quads
const NUM_INDICES = NUM_QUADS * 6; // 3840 indices

interface WebGLEngine {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  posBuffer: WebGLBuffer;
  texBuffer: WebGLBuffer;
  rowWidthBuffer: WebGLBuffer;
  rowProgBuffer: WebGLBuffer;
  indBuffer: WebGLBuffer;
  positions: Float32Array;
  rowWidths: Float32Array;
  rowProgs: Float32Array;
  posLoc: number;
  texLoc: number;
  rowWidthLoc: number;
  rowProgLoc: number;
  resLoc: WebGLUniformLocation;
  alphaLoc: WebGLUniformLocation;
  progressLoc: WebGLUniformLocation;
  heightLoc: WebGLUniformLocation;
  radiusLoc: WebGLUniformLocation;
  downwardLoc: WebGLUniformLocation;
  flightDirLoc: WebGLUniformLocation;
  uvMinLoc: WebGLUniformLocation;
  uvMaxLoc: WebGLUniformLocation;
  texture: WebGLTexture;
}

let cachedEngine: WebGLEngine | null = null;

function getWebGLEngine(): WebGLEngine | null {
  if (typeof window === "undefined") return null;
  if (cachedEngine) {
    if (!cachedEngine.gl.isContextLost()) {
      return cachedEngine;
    }
    try {
      cachedEngine.canvas.remove();
    } catch (_) {}
    cachedEngine = null;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "999999";
    canvas.style.display = "none";
    document.body.appendChild(canvas);

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance"
    }) as WebGLRenderingContext | null;

    if (!gl) {
      canvas.remove();
      return null;
    }

    const vsSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      attribute float a_rowWidth;
      attribute float a_rowProgress;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      varying float v_rowWidth;
      varying float v_rowProgress;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1.0, -1.0), 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_rowWidth = a_rowWidth;
        v_rowProgress = a_rowProgress;
      }
    `;

    const fsSource = `
      precision mediump float;
      uniform sampler2D u_image;
      uniform float u_alpha;
      uniform float u_progress;
      uniform float u_currentHeight;
      uniform float u_radius;
      uniform float u_isDownward;
      uniform vec2 u_flightDir;
      uniform vec2 u_uvMin;
      uniform vec2 u_uvMax;
      varying vec2 v_texCoord;
      varying float v_rowWidth;
      varying float v_rowProgress;

      // Inigo Quilez Signed Distance Function for 2D Rounded Box
      float sdRoundedBox(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + vec2(r);
        return min(max(q.x, q.y), 0.0) + length(max(q, vec2(0.0))) - r;
      }

      void main() {
        // 1. Pixel-perfect object-cover crop UV mapping
        vec2 imgUV = mix(u_uvMin, u_uvMax, v_texCoord);
        vec4 texColor = texture2D(u_image, imgUV);

        // 2. Exact Signed Distance to 16px Rounded Box (adaptive radius R)
        vec2 p = vec2((v_texCoord.x - 0.5) * v_rowWidth, (v_texCoord.y - 0.5) * u_currentHeight);
        vec2 b = vec2(v_rowWidth * 0.5, u_currentHeight * 0.5);
        float r = clamp(u_radius, 0.0, max(0.0, min(b.x, b.y) - 0.5));
        float dist = sdRoundedBox(p, b, r);

        // 3. Subpixel screen anti-aliasing feather across 1.6px (-0.8px to +0.8px)
        float shapeAlpha = 1.0 - smoothstep(-0.8, 0.8, dist);
        if (shapeAlpha <= 0.0) {
          discard;
        }

        // 4. Progressive Proximity Fading (Chỉ làm mờ ở cự ly gần sát miệng giỏ hàng)
        // Trong suốt 90% chặng bay đầu: 100% độ rõ nét nguyên bản.
        // Chỉ mờ dần khi chạm sát miệng giỏ hàng (v_rowProgress > 0.90 -> 1.0).
        float proximityAlpha = 1.0;
        if (v_rowProgress > 0.90) {
          proximityAlpha = (1.0 - v_rowProgress) / 0.10;
        }

        // Mờ toàn cục nhẹ ở 6% cuối cùng
        float globalFade = u_progress > 0.94 ? max(0.0, (1.0 - u_progress) / 0.06) : 1.0;
        float finalAlpha = texColor.a * shapeAlpha * proximityAlpha * u_alpha * globalFade;

        if (finalAlpha <= 0.001) {
          discard;
        }

        // Bề mặt ảnh giữ 100% màu sắc và chi tiết nguyên bản, không bị ám sáng hay phủ màu
        gl_FragColor = vec4(texColor.rgb * finalAlpha, finalAlpha);
      }
    `;

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("Shader compile error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      canvas.remove();
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      canvas.remove();
      return null;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Program link error:", gl.getProgramInfoLog(program));
      canvas.remove();
      return null;
    }
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, "a_position");
    const texLoc = gl.getAttribLocation(program, "a_texCoord");
    const rowWidthLoc = gl.getAttribLocation(program, "a_rowWidth");
    const rowProgLoc = gl.getAttribLocation(program, "a_rowProgress");

    const resLoc = gl.getUniformLocation(program, "u_resolution")!;
    const alphaLoc = gl.getUniformLocation(program, "u_alpha")!;
    const progressLoc = gl.getUniformLocation(program, "u_progress")!;
    const heightLoc = gl.getUniformLocation(program, "u_currentHeight")!;
    const radiusLoc = gl.getUniformLocation(program, "u_radius")!;
    const downwardLoc = gl.getUniformLocation(program, "u_isDownward")!;
    const flightDirLoc = gl.getUniformLocation(program, "u_flightDir")!;
    const uvMinLoc = gl.getUniformLocation(program, "u_uvMin")!;
    const uvMaxLoc = gl.getUniformLocation(program, "u_uvMax")!;

    // Static Precomputed Coordinates
    const texCoords = new Float32Array(NUM_VERTICES * 2);
    for (let r = 0; r <= MESH_ROWS; r++) {
      const v = r / MESH_ROWS;
      for (let c = 0; c <= MESH_COLS; c++) {
        const u = c / MESH_COLS;
        const idx = (r * (MESH_COLS + 1) + c) * 2;
        texCoords[idx] = u;
        texCoords[idx + 1] = v;
      }
    }

    const indices = new Uint16Array(NUM_INDICES);
    let iIdx = 0;
    for (let r = 0; r < MESH_ROWS; r++) {
      for (let c = 0; c < MESH_COLS; c++) {
        const tl = r * (MESH_COLS + 1) + c;
        const tr = tl + 1;
        const bl = (r + 1) * (MESH_COLS + 1) + c;
        const br = bl + 1;
        indices[iIdx++] = tl;
        indices[iIdx++] = bl;
        indices[iIdx++] = br;
        indices[iIdx++] = tl;
        indices[iIdx++] = br;
        indices[iIdx++] = tr;
      }
    }

    const texBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    const indBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    const posBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, NUM_VERTICES * 2 * 4, gl.DYNAMIC_DRAW);

    const rowWidthBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, rowWidthBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, NUM_VERTICES * 4, gl.DYNAMIC_DRAW);

    const rowProgBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, rowProgBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, NUM_VERTICES * 4, gl.DYNAMIC_DRAW);

    const texture = gl.createTexture()!;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    cachedEngine = {
      canvas,
      gl,
      program,
      posBuffer,
      texBuffer,
      rowWidthBuffer,
      rowProgBuffer,
      indBuffer,
      positions: new Float32Array(NUM_VERTICES * 2),
      rowWidths: new Float32Array(NUM_VERTICES),
      rowProgs: new Float32Array(NUM_VERTICES),
      posLoc,
      texLoc,
      rowWidthLoc,
      rowProgLoc,
      resLoc,
      alphaLoc,
      progressLoc,
      heightLoc,
      radiusLoc,
      downwardLoc,
      flightDirLoc,
      uvMinLoc,
      uvMaxLoc,
      texture
    };

    return cachedEngine;
  } catch (err) {
    console.warn("Failed to initialize WebGL engine:", err);
    return null;
  }
}

// Warm up WebGL engine on browser idle so first interaction has zero compilation latency
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(() => getWebGLEngine());
  } else {
    setTimeout(() => getWebGLEngine(), 1000);
  }
}

/**
 * Executes a true macOS Genie Effect: bending and warping the image
 * into the shopping cart target with fluid funnel suction curvature.
 */
export async function addToBasket({
  image,
  basket,
  duration = 460, // 20% faster (accelerated from 580ms to 460ms)
}: AddToBasketOptions): Promise<boolean> {
  if (typeof window === "undefined" || !image || !basket) return false;

  // Prevent double-clicking / rapid spam clicks within the animation cooldown period
  const now = Date.now();
  if (isBasketAnimating || now - lastBasketTriggerTime < BASKET_COOLDOWN_MS) {
    return false;
  }
  isBasketAnimating = true;
  lastBasketTriggerTime = now;

  const imgEl = "getElement" in image && typeof image.getElement === "function" ? image.getElement() : (image as HTMLElement);
  const basketEl = "getElement" in basket && typeof basket.getElement === "function" ? basket.getElement() : (basket as HTMLElement);

  if (!imgEl || !basketEl) {
    isBasketAnimating = false;
    return false;
  }

  const innerImg = imgEl.querySelector("img") || (imgEl instanceof HTMLImageElement ? imgEl : null);

  let startRect = imgEl.getBoundingClientRect();
  if ((startRect.width === 0 || startRect.height === 0) && innerImg) {
    startRect = innerImg.getBoundingClientRect();
  }
  const endRect = basketEl.getBoundingClientRect();

  if (startRect.width === 0 || startRect.height === 0) {
    startRect = {
      left: window.innerWidth * 0.2,
      top: window.innerHeight * 0.25,
      width: 280,
      height: 280,
      right: window.innerWidth * 0.2 + 280,
      bottom: window.innerHeight * 0.25 + 280,
      x: window.innerWidth * 0.2,
      y: window.innerHeight * 0.25,
      toJSON: () => {}
    };
  }

  // Handle case where user scrolled down and the main image is offscreen
  let initialTop = startRect.top;
  let initialLeft = startRect.left;
  let initialWidth = startRect.width;
  let initialHeight = startRect.height;

  if (startRect.bottom <= 60 || startRect.top < -50) {
    // Clamp to visible upper viewport region
    initialTop = Math.max(startRect.top, 80);
    initialLeft = Math.max(startRect.left, 40);
    initialWidth = Math.min(startRect.width, 260);
    initialHeight = Math.min(startRect.height, 260);
  }

  const endCenterX = endRect.left + endRect.width / 2;
  const endCenterY = endRect.top + endRect.height / 2;

  // Hiệu ứng ám ánh sáng cam trắng phát ra từ icon giỏ hàng hướng về phía hình ảnh đang bay tới
  const triggerCartApproachLight = () => {
    try {
      const flightDx = endCenterX - (initialLeft + initialWidth * 0.5);
      const flightDy = endCenterY - (initialTop + initialHeight * 0.5);
      // Góc vector từ icon giỏ hàng chiếu ngược về phía hướng bay của hình ảnh tới
      const angleRad = Math.atan2(-flightDy, -flightDx);
      const angleDeg = angleRad * (180 / Math.PI);

      // 1. Quầng sáng cam trắng định hướng tỏa ra từ giỏ hàng đón vệt ảnh bay tới
      const lightPlume = document.createElement("div");
      lightPlume.style.position = "fixed";
      lightPlume.style.left = `${endCenterX}px`;
      lightPlume.style.top = `${endCenterY}px`;
      lightPlume.style.width = "96px";
      lightPlume.style.height = "56px";
      lightPlume.style.borderRadius = "50%";
      lightPlume.style.pointerEvents = "none";
      lightPlume.style.zIndex = "999998";
      lightPlume.style.transformOrigin = "28% 50%";
      lightPlume.style.background = "radial-gradient(ellipse at 28% 50%, rgba(255, 255, 255, 0.98) 0%, rgba(255, 150, 50, 0.85) 36%, rgba(255, 80, 20, 0.4) 68%, transparent 100%)";
      lightPlume.style.boxShadow = "0 0 28px 6px rgba(255, 90, 25, 0.48), 0 0 12px 3px rgba(255, 255, 255, 0.75)";
      lightPlume.style.willChange = "transform, opacity";
      document.body.appendChild(lightPlume);

      const plumeAnim = lightPlume.animate(
        [
          { transform: `translate(-28%, -50%) rotate(${angleDeg}deg) scale(0.3)`, opacity: 0 },
          { transform: `translate(-28%, -50%) rotate(${angleDeg}deg) scale(1.12)`, opacity: 1, offset: 0.45 },
          { transform: `translate(-28%, -50%) rotate(${angleDeg}deg) scale(1.0)`, opacity: 0.85, offset: 0.75 },
          { transform: `translate(-28%, -50%) rotate(${angleDeg}deg) scale(1.25)`, opacity: 0, offset: 1.0 }
        ],
        {
          duration: 440,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );
      plumeAnim.onfinish = () => lightPlume.remove();

      // 2. Chớp sáng ám ánh sáng cam trắng trên icon giỏ hàng
      if (basketEl) {
        basketEl.animate(
          [
            { filter: "drop-shadow(0 0 0px transparent)" },
            { filter: "drop-shadow(0 0 16px rgba(255, 125, 45, 0.85)) brightness(1.2)", offset: 0.45 },
            { filter: "drop-shadow(0 0 0px transparent)", offset: 1.0 }
          ],
          {
            duration: 440,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)"
          }
        );
      }
    } catch (_) {}
  };

  const triggerPostEffects = () => {
    // 1. Elastic squash & stretch bounce on target icon (speed increased by 20%: 380ms)
    if ("triggerBounce" in basket && typeof basket.triggerBounce === "function") {
      basket.triggerBounce();
    } else if (basketEl) {
      basketEl.animate(
        [
          { transform: "translateY(0px) scale(1, 1)" },
          { transform: "translateY(-10px) scale(1.22, 0.86)", offset: 0.25 },
          { transform: "translateY(3px) scale(0.92, 1.08)", offset: 0.52 },
          { transform: "translateY(-4px) scale(1.06, 0.96)", offset: 0.75 },
          { transform: "translateY(1px) scale(0.98, 1.02)", offset: 0.9 },
          { transform: "translateY(0px) scale(1, 1)", offset: 1.0 }
        ],
        { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    }

    // 2. Radiant orange impact ripple ring (speed increased by 20%: 350ms)
    try {
      const ripple = document.createElement("div");
      ripple.style.position = "fixed";
      ripple.style.left = `${endCenterX - 24}px`;
      ripple.style.top = `${endCenterY - 24}px`;
      ripple.style.width = "48px";
      ripple.style.height = "48px";
      ripple.style.borderRadius = "9999px";
      ripple.style.border = "2px solid #FF4D24";
      ripple.style.boxShadow = "0 0 16px rgba(255, 77, 36, 0.6), inset 0 0 8px rgba(255, 140, 0, 0.4)";
      ripple.style.pointerEvents = "none";
      ripple.style.zIndex = "999999";
      ripple.style.willChange = "transform, opacity";
      document.body.appendChild(ripple);

      const rippleAnim = ripple.animate(
        [
          { transform: "scale(0.6)", opacity: 1 },
          { transform: "scale(1.85)", opacity: 0 }
        ],
        {
          duration: 350,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "forwards"
        }
      );
      rippleAnim.onfinish = () => ripple.remove();
    } catch (_) {}

    // 3. Rising floating "+1" particle (speed increased by 20%: 540ms)
    try {
      const plusOne = document.createElement("div");
      plusOne.textContent = "+1";
      plusOne.style.position = "fixed";
      plusOne.style.left = `${endCenterX - 10}px`;
      plusOne.style.top = `${endCenterY - 20}px`;
      plusOne.style.fontSize = "13px";
      plusOne.style.fontWeight = "900";
      plusOne.style.fontFamily = "sans-serif";
      plusOne.style.color = "#FF4D24";
      plusOne.style.textShadow = "0 1px 4px rgba(255,77,36,0.35), 0 0 2px #fff";
      plusOne.style.pointerEvents = "none";
      plusOne.style.zIndex = "999999";
      plusOne.style.userSelect = "none";
      document.body.appendChild(plusOne);

      const plusAnim = plusOne.animate(
        [
          { transform: "translateY(0px) scale(0.6)", opacity: 0 },
          { transform: "translateY(-14px) scale(1.2)", opacity: 1, offset: 0.35 },
          { transform: "translateY(-30px) scale(0.95)", opacity: 0, offset: 1.0 }
        ],
        {
          duration: 540,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards"
        }
      );
      plusAnim.onfinish = () => plusOne.remove();
    } catch (_) {}
  };

  // Universal high-fidelity DOM flight fallback (for non-images, CORS tainted textures, or broken image URLs)
  const runDomFlight = (): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      const clone = document.createElement("div");
      clone.style.position = "fixed";
      clone.style.top = `${initialTop}px`;
      clone.style.left = `${initialLeft}px`;
      clone.style.width = `${initialWidth}px`;
      clone.style.height = `${initialHeight}px`;
      clone.style.margin = "0";
      clone.style.zIndex = "999999";
      clone.style.pointerEvents = "none";
      clone.style.transformOrigin = "bottom center";
      clone.style.boxSizing = "border-box";
      clone.style.borderRadius = "16px";
      clone.style.overflow = "hidden";
      clone.style.boxShadow = "0 20px 45px -10px rgba(255, 77, 36, 0.5), 0 0 0 1.5px rgba(255, 255, 255, 0.85)";
      clone.style.willChange = "transform, opacity, border-radius";

      const childClone = imgEl.cloneNode(true) as HTMLElement;
      childClone.style.width = "100%";
      childClone.style.height = "100%";
      clone.appendChild(childClone);
      document.body.appendChild(clone);

      const startCenterX = initialLeft + initialWidth / 2;
      const startCenterY = initialTop + initialHeight / 2;
      const deltaX = endCenterX - startCenterX;
      const deltaY = endCenterY - startCenterY;
      const scaleX = (endRect.width || 40) / initialWidth;
      const scaleY = (endRect.height || 40) / initialHeight;
      const finalTargetScale = Math.max(Math.min(scaleX, scaleY), 0.05);

      const animation = clone.animate(
        [
          {
            transform: "translate3d(0px, 0px, 0px) scale(1) skew(0deg, 0deg)",
            opacity: 1,
            borderRadius: "16px",
          },
          {
            transform: `translate3d(${deltaX * 0.22}px, ${deltaY * 0.12}px, 0px) scale(0.85, 0.95) skew(-6deg, 4deg)`,
            opacity: 0.98,
            borderRadius: "18px",
            offset: 0.3,
          },
          {
            transform: `translate3d(${deltaX * 0.65}px, ${deltaY * 0.52}px, 0px) scale(0.52, 0.68) skew(-12deg, 8deg)`,
            opacity: 0.92,
            borderRadius: "14px",
            offset: 0.65,
          },
          {
            transform: `translate3d(${deltaX}px, ${deltaY}px, 0px) scale(${finalTargetScale * 0.3}) skew(-4deg, 2deg)`,
            opacity: 0,
            borderRadius: "8px",
          },
        ],
        {
          duration,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );

      const approachTimer = setTimeout(() => {
        triggerCartApproachLight();
      }, duration * 0.52);

      animation.onfinish = () => {
        clearTimeout(approachTimer);
        clone.remove();
        triggerPostEffects();
        isBasketAnimating = false;
        resolve(true);
      };

      animation.oncancel = () => {
        clearTimeout(approachTimer);
        clone.remove();
        isBasketAnimating = false;
        resolve(false);
      };
    });
  };

  // GPU WebGL Mesh Deformer (Compiz-alike Magic Lamp Effect)
  const runWebGLMesh = (source: HTMLImageElement): Promise<boolean> | null => {
    const engine = getWebGLEngine();
    if (!engine) return null;

    const {
      canvas,
      gl,
      program,
      posBuffer,
      texBuffer,
      rowWidthBuffer,
      rowProgBuffer,
      indBuffer,
      positions,
      rowWidths,
      rowProgs,
      posLoc,
      texLoc,
      rowWidthLoc,
      rowProgLoc,
      resLoc,
      alphaLoc,
      progressLoc,
      heightLoc,
      radiusLoc,
      downwardLoc,
      flightDirLoc,
      uvMinLoc,
      uvMaxLoc,
      texture,
    } = engine;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetX = endCenterX;
    const targetY = endCenterY;
    const targetWidth = Math.max(endRect.width * 0.28, 4);

    const deltaYTotal = targetY - (initialTop + initialHeight / 2);
    const isDownward = deltaYTotal >= 0;

    // Bounding-Box Canvas with generous padding to prevent edge clipping
    const pad = 80;
    const minX = Math.max(0, Math.floor(Math.min(initialLeft, targetX) - pad));
    const minY = Math.max(0, Math.floor(Math.min(initialTop, targetY) - pad));
    const maxX = Math.min(window.innerWidth, Math.ceil(Math.max(initialLeft + initialWidth, targetX) + pad));
    const maxY = Math.min(window.innerHeight, Math.ceil(Math.max(initialTop + initialHeight, targetY) + pad));
    const bboxW = Math.max(16, maxX - minX);
    const bboxH = Math.max(16, maxY - minY);

    canvas.width = Math.round(bboxW * dpr);
    canvas.height = Math.round(bboxH * dpr);
    canvas.style.top = `${minY}px`;
    canvas.style.left = `${minX}px`;
    canvas.style.width = `${bboxW}px`;
    canvas.style.height = `${bboxH}px`;
    canvas.style.display = "block";

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(resLoc, bboxW, bboxH);

    // Flight direction vector from start center to target center
    const flightDx = targetX - (initialLeft + initialWidth * 0.5);
    const flightDy = targetY - (initialTop + initialHeight * 0.5);
    const flightLen = Math.hypot(flightDx, flightDy) || 1;
    gl.uniform2f(flightDirLoc, flightDx / flightLen, flightDy / flightLen);

    // Compute pixel-perfect object-cover crop UV bounds matching DOM image
    const naturalW = source.naturalWidth || initialWidth;
    const naturalH = source.naturalHeight || initialHeight;
    const imgAspect = naturalW / naturalH;
    const boxAspect = initialWidth / initialHeight;
    let uMin = 0.0, uMax = 1.0, vMin = 0.0, vMax = 1.0;
    if (imgAspect > boxAspect) {
      const visibleW = boxAspect / imgAspect;
      uMin = (1.0 - visibleW) * 0.5;
      uMax = (1.0 + visibleW) * 0.5;
    } else {
      const visibleH = imgAspect / boxAspect;
      vMin = (1.0 - visibleH) * 0.5;
      vMax = (1.0 + visibleH) * 0.5;
    }
    gl.uniform2f(uvMinLoc, uMin, vMin);
    gl.uniform2f(uvMaxLoc, uMax, vMax);

    // Compute corner radius (16px base adaptive)
    let cornerRadius = 16.0;
    try {
      const cs = window.getComputedStyle(source);
      const br = parseFloat(cs.borderRadius);
      if (!isNaN(br) && br > 0) cornerRadius = Math.max(8.0, Math.min(br, 24.0));
    } catch (_) {}
    gl.uniform1f(radiusLoc, cornerRadius);
    gl.uniform1f(downwardLoc, isDownward ? 1.0 : 0.0);

    // Upload texture with linear filtering
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    } catch (_) {
      canvas.style.display = "none";
      return null;
    }

    // Bind static vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indBuffer);

    // Bind dynamic vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, rowWidthBuffer);
    gl.enableVertexAttribArray(rowWidthLoc);
    gl.vertexAttribPointer(rowWidthLoc, 1, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, rowProgBuffer);
    gl.enableVertexAttribArray(rowProgLoc);
    gl.vertexAttribPointer(rowProgLoc, 1, gl.FLOAT, false, 0, 0);

    // Precompute geometry for Compiz Genie suction curve
    const localTargetX = targetX - minX;
    const localTargetY = targetY - minY;
    const localNodeStartX = initialLeft + initialWidth * 0.5 - minX;

    const nodeDelay = new Float32Array(MESH_ROWS + 1);
    const nodeStartY = new Float32Array(MESH_ROWS + 1);
    const nodeDx = new Float32Array(MESH_ROWS + 1);
    const nodeDy = new Float32Array(MESH_ROWS + 1);

    for (let j = 0; j <= MESH_ROWS; j++) {
      const v = j / MESH_ROWS;
      nodeDelay[j] = isDownward
        ? Math.pow(1 - v, 1.25) * 0.36
        : Math.pow(v, 1.25) * 0.36;
      const sY = initialTop + v * initialHeight - minY;
      nodeStartY[j] = sY;
      nodeDx[j] = localTargetX - localNodeStartX;
      nodeDy[j] = localTargetY - sY;
    }

    return new Promise<boolean>((resolve) => {
      let startTime = 0;
      const sliceDuration = 0.64;
      let animFrameId: number | null = null;
      let approachLightTriggered = false;

      const tick = (now: number) => {
        if (!startTime) {
          startTime = now;
        }
        const elapsed = now - startTime;
        const rawT = Math.min(1, elapsed / duration);

        if (!approachLightTriggered && rawT >= 0.52) {
          approachLightTriggered = true;
          triggerCartApproachLight();
        }

        // Update Mesh Nodes directly on GPU vertex buffer
        for (let j = 0; j <= MESH_ROWS; j++) {
          const rawProgress = (rawT - nodeDelay[j]) / sliceDuration;
          const localProgress = rawProgress <= 0 ? 0 : rawProgress >= 1 ? 1 : rawProgress;

          // Hermite cubic ease-in-out curve
          const p = localProgress * localProgress * (3 - 2 * localProgress);

          const dx = nodeDx[j];
          const dy = nodeDy[j];

          // Lateral fluid S-curve / genie lamp vapor arc
          const lateralArc = Math.sin(p * Math.PI) * (dx * 0.16);
          const cx = localNodeStartX + dx * p + lateralArc;

          // Vertical suction acceleration into dock target
          const cy = nodeStartY[j] + dy * (0.28 * p + 0.72 * p * p);

          // Width with genie waist pinch
          const pinchFactor = Math.sin(p * Math.PI) * 0.22;
          const currW = Math.max(
            2,
            (initialWidth * (1 - p) + targetWidth * p) * (1 - pinchFactor)
          );

          for (let c = 0; c <= MESH_COLS; c++) {
            const u = c / MESH_COLS;
            const xOff = (u - 0.5) * currW;
            const vIdx = j * (MESH_COLS + 1) + c;
            positions[vIdx * 2] = cx + xOff;
            positions[vIdx * 2 + 1] = cy;
            rowWidths[vIdx] = currW;
            rowProgs[vIdx] = p;
          }
        }

        // Current height contracts as flight progresses
        const currentHeight = Math.max(4, initialHeight * (1 - rawT * 0.75));
        gl.uniform1f(heightLoc, currentHeight);

        // Overall alpha
        gl.uniform1f(alphaLoc, 1.0);
        gl.uniform1f(progressLoc, rawT);

        // Upload dynamic vertex data via bufferSubData
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);

        gl.bindBuffer(gl.ARRAY_BUFFER, rowWidthBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, rowWidths);

        gl.bindBuffer(gl.ARRAY_BUFFER, rowProgBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, rowProgs);

        // Render entire continuous deformed mesh in ONE single GPU draw call
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawElements(gl.TRIANGLES, NUM_INDICES, gl.UNSIGNED_SHORT, 0);

        if (rawT < 1) {
          animFrameId = requestAnimationFrame(tick);
        } else {
          canvas.style.display = "none";
          gl.clear(gl.COLOR_BUFFER_BIT);
          triggerPostEffects();
          isBasketAnimating = false;
          resolve(true);
        }
      };

      animFrameId = requestAnimationFrame(tick);
    });
  };

  // If we have an image element that is already loaded, attempt GPU WebGL Mesh Deformer
  if (innerImg && innerImg.complete && innerImg.naturalWidth > 0) {
    const webglPromise = runWebGLMesh(innerImg);
    if (webglPromise) {
      return webglPromise;
    }
    return runDomFlight();
  }

  // If image element is still downloading, wait briefly for load or fall back seamlessly
  if (innerImg && !innerImg.complete) {
    return new Promise<boolean>((resolve) => {
      let resolved = false;
      const fallbackTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(runDomFlight());
        }
      }, 140);

      innerImg.addEventListener("load", () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          if (innerImg.naturalWidth > 0) {
            const res = runWebGLMesh(innerImg);
            if (res) {
              resolve(res);
              return;
            }
          }
          resolve(runDomFlight());
        }
      }, { once: true });

      innerImg.addEventListener("error", () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(fallbackTimer);
          resolve(runDomFlight());
        }
      }, { once: true });
    });
  }

  // Fallback for non-image elements, SVG nodes, or missing/broken images
  return runDomFlight();
}

