/* ═══════════════════════════════════════════════════════════════
   NEON ENERGY LINES — Canvas-based animated background
   Used on the Landing page for the dramatic intro sequence
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";

interface EnergyLine {
  points: { x: number; y: number }[];
  progress: number;
  speed: number;
  color: string;
  width: number;
  opacity: number;
  settled: boolean;
}

const COLORS = ["#7c6aff", "#00f5ff", "#ff2d78"];

function createLine(w: number, h: number): EnergyLine {
  const side = Math.floor(Math.random() * 2); // 0=bottom-left, 1=bottom-right
  const startX = side === 0 ? Math.random() * w * 0.3 : w - Math.random() * w * 0.3;
  const startY = h + 10;

  const midPoints = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => {
    const t = (i + 1) / 5;
    return {
      x: startX + (w / 2 - startX) * t + (Math.random() - 0.5) * 200,
      y: startY - h * t * 0.8 + (Math.random() - 0.5) * 100,
    };
  });

  return {
    points: [{ x: startX, y: startY }, ...midPoints],
    progress: 0,
    speed: 0.015 + Math.random() * 0.02,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: 1 + Math.random() * 2,
    opacity: 0.4 + Math.random() * 0.4,
    settled: false,
  };
}

export default function NeonLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let lines: EnergyLine[] = [];
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create initial batch of lines
    for (let i = 0; i < 12; i++) {
      lines.push(createLine(canvas.width, canvas.height));
    }

    const draw = () => {
      time += 0.005;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const line of lines) {
        if (line.progress < 1) {
          line.progress = Math.min(1, line.progress + line.speed);
        } else {
          line.settled = true;
        }

        const drawCount = Math.floor(line.points.length * line.progress);
        if (drawCount < 2) continue;

        // Ambient drift when settled
        const drift = line.settled ? Math.sin(time + line.speed * 100) * 2 : 0;
        const breatheOpacity = line.settled
          ? line.opacity * (0.3 + 0.15 * Math.sin(time * 2 + line.speed * 50))
          : line.opacity * line.progress;

        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width;
        ctx.globalAlpha = breatheOpacity;
        ctx.shadowColor = line.color;
        ctx.shadowBlur = 20;

        ctx.moveTo(line.points[0].x, line.points[0].y + drift);
        for (let j = 1; j < drawCount; j++) {
          const p = line.points[j];
          ctx.lineTo(p.x + drift * 0.5, p.y + drift);
        }
        ctx.stroke();

        // Glow trail (wider, lower opacity)
        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = line.width * 3;
        ctx.globalAlpha = breatheOpacity * 0.15;
        ctx.shadowBlur = 40;

        ctx.moveTo(line.points[0].x, line.points[0].y + drift);
        for (let j = 1; j < drawCount; j++) {
          const p = line.points[j];
          ctx.lineTo(p.x + drift * 0.5, p.y + drift);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
