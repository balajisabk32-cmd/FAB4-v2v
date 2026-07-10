"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * PetalWind — Floral Petal Wind background effect.
 *
 * A continuous, non-intrusive canvas field of soft, blurred lavender and
 * pink petals drifting across the screen. Petals react subtly to mouse
 * movement (deflect gently toward/away from the cursor).
 *
 * Implementation:
 *   - Pure 2D canvas for performance (no DOM nodes per petal).
 *   - anime.js drives a global wind timeline that eases the ambient drift
 *     direction smoothly back and forth (so the wind feels alive, not looped).
 *   - Each petal has its own physics state (pos, vel, rotation, wobble).
 *   - Lens blur is faked with layered translucent draws + shadowBlur.
 *   - Honors prefers-reduced-motion: renders nothing (static page).
 *   - pointermove tracked via ref (no React re-renders).
 *   - Full cleanup on unmount.
 *
 * Marked pointer-events-none so it never blocks interaction.
 */

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  hue: "lavender" | "pink";
  alpha: number;
  depth: number; // 0.4 (far) -> 1 (near), drives parallax + blur
};

const PALETTE = {
  lavender: ["#ece0f7", "#d9c2ee", "#c3a3e4", "#a982d6"],
  pink: ["#fbe5ea", "#f6c6d2", "#ee9fb1", "#e2758d"],
};

export function PetalWind() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return; // no animation under reduced motion
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    // ---- Mouse tracking (ref, never React state) ----
    const mouse = { x: width / 2, y: height / 2, active: false };
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave, { passive: true });

    // ---- Petal population ----
    // Denser, more immersive floral storm: ~280 on a full HD viewport, never
    // fewer than 120 so even small screens feel lush. Reduced-motion renders
    // nothing (handled above), so this only affects the animated path.
    const density = Math.min(
      280,
      Math.max(120, Math.floor((width * height) / 7000))
    );
    const petals: Petal[] = [];

    const spawnPetal = (fromLeft = false): Petal => {
      const depth = 0.4 + Math.random() * 0.6;
      return {
        x: fromLeft
          ? -40
          : Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        size: (6 + Math.random() * 14) * depth,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        hue: Math.random() > 0.45 ? "lavender" : "pink",
        alpha: (0.18 + Math.random() * 0.3) * depth,
        depth,
      };
    };

    for (let i = 0; i < density; i++) petals.push(spawnPetal(false));

    // ---- Global wind, eased alive by anime.js ----
    // windTarget.x / windTarget.y are eased toward periodically-changing goals.
    const wind = { x: 0.35, y: 0.15 };
    const windTarget = { x: 0.35, y: 0.15 };

    // anime.js orchestrates slow, organic shifts in wind direction.
    // (Imported dynamically so SSR is safe and the effect is a leaf concern.)
    let anime: typeof import("animejs") | null = null;
    let windTimeline: any = null;
    import("animejs").then((mod) => {
      anime = mod.default || (mod as any);
      // Re-randomize wind direction every ~6-10s, easing toward new vector.
      windTimeline = anime?.timeline({
        loop: true,
        autoplay: true,
        update: () => {
          // soft decay so wind stays calm
        },
      });
      const shiftWind = () => {
        windTarget.x = 0.15 + Math.random() * 0.55; // mostly blowing right
        windTarget.y = -0.05 + (Math.random() - 0.5) * 0.4;
        anime?.({
          targets: wind,
          x: windTarget.x,
          y: windTarget.y,
          duration: 6000 + Math.random() * 4000,
          easing: "easeInOutSine",
          complete: shiftWind,
        });
      };
      shiftWind();
    });

    // ---- Draw a single petal (soft teardrop via two bezier curves) ----
    const drawPetal = (p: Petal) => {
      const colors = PALETTE[p.hue];
      const c = colors[Math.floor(p.depth * (colors.length - 1))];

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      const wobbleScale = 1 + Math.sin(p.wobble) * 0.12;
      ctx.scale(wobbleScale, 1);
      ctx.globalAlpha = p.alpha;

      // Soft blur via shadow (cheap fake of lens blur).
      ctx.shadowColor = c;
      ctx.shadowBlur = 10 * p.depth;

      ctx.beginPath();
      // teardrop petal shape
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(
        p.size * 0.7,
        -p.size * 0.5,
        p.size * 0.6,
        p.size * 0.7,
        0,
        p.size
      );
      ctx.bezierCurveTo(
        -p.size * 0.6,
        p.size * 0.7,
        -p.size * 0.7,
        -p.size * 0.5,
        0,
        -p.size
      );
      ctx.closePath();

      // translucent radial fill for depth
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
      grad.addColorStop(0, c);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();
    };

    // ---- Main animation loop ----
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];

        // wind force scaled by depth (near petals pushed harder)
        p.vx += wind.x * 0.03 * p.depth;
        p.vy += wind.y * 0.03 * p.depth;

        // wobble (flutter)
        p.wobble += p.wobbleSpeed;
        p.vy += Math.sin(p.wobble) * 0.008;

        // mouse interaction: gentle deflection near cursor
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const distSq = dx * dx + dy * dy;
          const radius = 140;
          if (distSq < radius * radius && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const force = (1 - dist / radius) * 0.6 * p.depth;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // damping so petals don't accelerate forever
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed + p.vx * 0.01;

        // recycle when off-screen
        if (p.x > width + 50 || p.x < -60 || p.y > height + 60 || p.y < -60) {
          // respawn from the left edge mostly, occasionally top
          const fromLeft = Math.random() > 0.25;
          Object.assign(p, spawnPetal(fromLeft));
          if (!fromLeft) {
            p.x = Math.random() * width;
            p.y = -40;
          }
        }

        drawPetal(p);
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => setSize();
    window.addEventListener("resize", onResize, { passive: true });

    // ---- Cleanup ----
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", onResize);
      if (windTimeline) windTimeline.pause();
    };
  }, [reduce]);

  if (reduce) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
