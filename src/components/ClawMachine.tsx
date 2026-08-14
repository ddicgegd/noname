/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";


const PRIZES = ["🎁", "📦", "⭐", "🎯", "🏆", "💎", "🎀", "🔮"];
const PRIZE_COUNT = 7;

interface Prize {
  id: number;
  emoji: string;
  x: number;   // 0-1 normalised
  grabbed: boolean;
  falling: boolean;
  fy: number;  // fall progress 0-1
}

type Phase = "slide" | "drop" | "grab" | "lift" | "release";

interface ClawState {
  x: number;        // 0-1 claw head X
  ropeLen: number;  // 0-1 (0 = retracted, 1 = fully dropped)
  phase: Phase;
  phaseT: number;   // time in current phase (seconds)
  targetX: number;  // where claw slides to
  grabbedId: number | null;
}

const RAIL_H = 0.13;      // rail zone top fraction
const CLAW_W = 0.10;      // claw head width fraction
const PRIZE_Y = 0.82;     // prize resting Y fraction
const DROP_SPEED = 0.55;  // rope extend speed (per second)
const LIFT_SPEED = 0.70;
const SLIDE_SPEED = 0.28; // claw slide speed (per second)
const PHASE_DUR: Record<Phase, number> = {
  slide: 0,    // dynamic — computed from distance
  drop: 0,     // dynamic
  grab: 0.45,
  lift: 0,     // dynamic
  release: 1.2,
};

function makePrizes(): Prize[] {
  const shuffled = [...PRIZES].sort(() => Math.random() - 0.5);
  return Array.from({ length: PRIZE_COUNT }, (_, i) => ({
    id: i,
    emoji: shuffled[i % shuffled.length],
    x: 0.08 + (i / (PRIZE_COUNT - 1)) * 0.84,
    grabbed: false,
    falling: false,
    fy: 0,
  }));
}

export default function ClawMachine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const prizes    = useRef<Prize[]>(makePrizes());
  const claw      = useRef<ClawState>({
    x: 0.5, ropeLen: 0, phase: "slide",
    phaseT: 0, targetX: Math.random() * 0.8 + 0.1,
    grabbedId: null,
  });
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  // Sync canvas pixel size to CSS size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let last = performance.now();


    function pickNextTarget() {
      const available = prizes.current.filter(p => !p.grabbed && !p.falling);
      if (available.length === 0) return Math.random() * 0.8 + 0.1;
      const pick = available[Math.floor(Math.random() * available.length)];
      return pick.x;
    }

    function tick(now: number) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const c = claw.current;
      const W = canvas!.width;
      const H = canvas!.height;

      // ---- Phase state machine ----
      c.phaseT += dt;

      if (c.phase === "slide") {
        const dist = Math.abs(c.targetX - c.x);
        const dir  = Math.sign(c.targetX - c.x);
        c.x += dir * SLIDE_SPEED * dt;
        if (Math.abs(c.targetX - c.x) < 0.005 || dist < 0.005) {
          c.x = c.targetX;
          c.phase = "drop";
          c.phaseT = 0;
        }
      } else if (c.phase === "drop") {
        c.ropeLen += DROP_SPEED * dt;
        if (c.ropeLen >= 1) { c.ropeLen = 1; c.phase = "grab"; c.phaseT = 0; }
      } else if (c.phase === "grab") {
        if (c.phaseT >= PHASE_DUR.grab) {
          // grab nearest prize within range
          const nearest = prizes.current
            .filter(p => !p.grabbed && !p.falling)
            .sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
          if (nearest && Math.abs(nearest.x - c.x) < 0.12) {
            c.grabbedId = nearest.id;
          }
          c.phase = "lift"; c.phaseT = 0;
        }
      } else if (c.phase === "lift") {
        c.ropeLen -= LIFT_SPEED * dt;
        if (c.ropeLen <= 0) {
          c.ropeLen = 0;
          // release grabbed prize into tray
          if (c.grabbedId !== null) {
            const p = prizes.current.find(p => p.id === c.grabbedId);
            if (p) { p.grabbed = true; p.falling = true; p.fy = 0; }
            c.grabbedId = null;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
          c.phase = "release"; c.phaseT = 0;
        }
      } else if (c.phase === "release") {
        if (c.phaseT >= PHASE_DUR.release) {
          c.targetX = pickNextTarget();
          c.phase = "slide"; c.phaseT = 0;
        }
      }

      // ---- Update falling prizes ----
      prizes.current.forEach(p => {
        if (p.falling && p.fy < 1) {
          p.fy = Math.min(p.fy + dt * 1.8, 1);
          if (p.fy >= 1) p.falling = false;
        }
      });

      // ---- Draw ----
      ctx.clearRect(0, 0, W, H);

      // Background subtle grid lines
      ctx.strokeStyle = "rgba(0,0,0,0.04)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.moveTo(W * i / 4, H * RAIL_H); ctx.lineTo(W * i / 4, H); ctx.stroke();
      }

      // Rail bar
      const railGrad = ctx.createLinearGradient(0, 0, W, 0);
      railGrad.addColorStop(0, "rgba(200,220,255,0.25)");
      railGrad.addColorStop(0.5, "rgba(220,235,255,0.40)");
      railGrad.addColorStop(1, "rgba(200,220,255,0.25)");
      ctx.fillStyle = railGrad;
      ctx.beginPath();
      ctx.roundRect(W * 0.04, H * (RAIL_H - 0.055), W * 0.92, H * 0.055, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(180,210,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Side pillars
      const pillarW = W * 0.035;
      [W * 0.04, W * 0.925].forEach(px => {
        const pg = ctx.createLinearGradient(px, H * RAIL_H, px + pillarW, H * RAIL_H);
        pg.addColorStop(0, "rgba(200,220,255,0.20)");
        pg.addColorStop(1, "rgba(200,220,255,0.10)");
        ctx.fillStyle = pg;
        ctx.fillRect(px, H * RAIL_H, pillarW, H * (1 - RAIL_H - 0.04));
      });

      // Rope
      const clawPx = c.x * W;
      const railBottom = H * RAIL_H;
      const ropeBottom = railBottom + c.ropeLen * H * (PRIZE_Y - RAIL_H - 0.06);
      ctx.strokeStyle = "rgba(120,140,180,0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(clawPx, railBottom);
      ctx.lineTo(clawPx, ropeBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Claw head body
      const cw = W * CLAW_W * 0.5;
      const ch = H * 0.045;
      const headGrad = ctx.createLinearGradient(clawPx - cw, ropeBottom, clawPx + cw, ropeBottom + ch);
      headGrad.addColorStop(0, "rgba(160,190,240,0.85)");
      headGrad.addColorStop(1, "rgba(100,140,220,0.75)");
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.roundRect(clawPx - cw, ropeBottom, cw * 2, ch, [4, 4, 2, 2]);
      ctx.fill();
      ctx.strokeStyle = "rgba(120,160,230,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Claw prongs (3 fingers)
      const prongLen = H * 0.048;
      const openAngle = c.phase === "grab" ? 0.15 : 0.38; // close during grab
      [-1, 0, 1].forEach(side => {
        const angle = side * openAngle;
        const px2 = clawPx + side * cw * 0.6 + Math.sin(angle) * prongLen;
        const py2 = ropeBottom + ch + Math.cos(angle) * prongLen;
        ctx.strokeStyle = "rgba(100,140,220,0.80)";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(clawPx + side * cw * 0.4, ropeBottom + ch);
        ctx.lineTo(px2, py2);
        ctx.stroke();
      });

      // Prizes on floor
      const floorY = H * PRIZE_Y;
      prizes.current.forEach(p => {
        if (p.grabbed && !p.falling) return; // already collected
        if (p.id === c.grabbedId) {
          // draw at claw position
          const gx = clawPx;
          const gy = ropeBottom + H * 0.07;
          ctx.font = `${Math.round(H * 0.055)}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = 1;
          ctx.fillText(p.emoji, gx, gy);
          return;
        }
        if (p.falling) {
          // animate dropping into tray
          const startY = H * 0.05;
          const endY   = H * 0.92;
          const fy = startY + (endY - startY) * easeOut(p.fy);
          ctx.globalAlpha = Math.min(p.fy * 3, 1);
          ctx.font = `${Math.round(H * 0.055)}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, W * 0.5, fy);
          ctx.globalAlpha = 1;
          return;
        }
        // resting on floor
        ctx.globalAlpha = 1;
        ctx.font = `${Math.round(H * 0.06)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        // subtle shadow
        ctx.shadowColor = "rgba(0,0,0,0.10)";
        ctx.shadowBlur  = 6;
        ctx.fillText(p.emoji, p.x * W, floorY);
        ctx.shadowBlur = 0;
      });

      // Tray at bottom
      const trayH = H * 0.10;
      const trayY = H - trayH;
      const trayGrad = ctx.createLinearGradient(0, trayY, 0, H);
      trayGrad.addColorStop(0, "rgba(200,220,255,0.20)");
      trayGrad.addColorStop(1, "rgba(210,225,255,0.35)");
      ctx.fillStyle = trayGrad;
      ctx.beginPath();
      ctx.roundRect(W * 0.04, trayY, W * 0.92, trayH, [0, 0, 8, 8]);
      ctx.fill();
      ctx.strokeStyle = "rgba(180,205,255,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // easeOut helper (module-level would cause issues with bundler, inline it)
  return (
    <div className="flex flex-col h-full relative">
      {/* Score badge */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/50 backdrop-blur-md border border-white/60 px-3 py-1 rounded-full shadow-sm">
        <span className="text-sm">🏆</span>
        <span className="font-sans text-xs font-semibold text-[#555555]">{score}</span>
      </div>

      {/* Label */}
      <div className="absolute top-3 left-3 z-10">
        <span className="font-sans text-[10px] font-semibold text-[#888] uppercase tracking-widest">Claw Machine</span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
        // set pixel dimensions via JS after mount
      />
    </div>
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
