import { useEffect, useRef, useState, useCallback } from "react";
import type { TileMap } from "./maps/testVillage";

// タイル色 (Prompt 1 段階の暫定パレット — 後でスプライトに差し替え可能)
const GROUND_COLORS: Record<number, string> = {
  0: "#4a8f3f", // 草
  1: "#c4a55a", // 道
  2: "#3a7ecf", // 水
  5: "#d4a76a", // 床(木)
  6: "#a0a0a0", // 床(石)
};

const OBJECT_COLORS: Record<number, string> = {
  3: "#7a7a7a",  // 石壁
  4: "#8b5e3c",  // 木壁
  7: "#ff7eb6",  // 花
  8: "#2d6b2d",  // 木
  9: "#5a5a5a",  // 岩
  10: "#c04040", // 屋根
  11: "#6b4226", // 扉
  12: "#d4a017", // 宝箱
  13: "#8b5e3c", // 看板
};

type Dir = "down" | "up" | "left" | "right";

interface PlayerState {
  x: number; // タイル座標
  y: number;
  pxOffsetX: number; // タイル間補間 (-tileSize..+tileSize)
  pxOffsetY: number;
  dir: Dir;
  moving: boolean;
}

const MOVE_FRAMES = 8;

interface Props {
  map: TileMap;
  viewTilesX?: number;
  viewTilesY?: number;
}

const TileMapCanvas = ({ map, viewTilesX = 11, viewTilesY = 13 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<PlayerState>({
    x: map.spawn.x,
    y: map.spawn.y,
    pxOffsetX: 0,
    pxOffsetY: 0,
    dir: "down",
    moving: false,
  });
  const moveStepRef = useRef(0);
  const heldDirRef = useRef<Dir | null>(null);
  const [, forceTick] = useState(0);

  const ts = map.tileSize;
  const cssW = viewTilesX * ts;
  const cssH = viewTilesY * ts;

  // 衝突チェック
  const canEnter = useCallback((tx: number, ty: number): boolean => {
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return false;
    return map.collision[ty][tx] === 0;
  }, [map]);

  // 移動開始
  const tryMove = useCallback((dir: Dir) => {
    const p = playerRef.current;
    if (p.moving) return;
    p.dir = dir;
    let nx = p.x, ny = p.y;
    if (dir === "up") ny -= 1;
    else if (dir === "down") ny += 1;
    else if (dir === "left") nx -= 1;
    else if (dir === "right") nx += 1;
    if (!canEnter(nx, ny)) {
      forceTick((v) => v + 1); // 向きだけ更新
      return;
    }
    p.moving = true;
    moveStepRef.current = 0;
  }, [canEnter]);

  // ループ: 描画 + 移動補間
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(loop); return; }

      const p = playerRef.current;

      // 移動補間
      if (p.moving) {
        moveStepRef.current += 1;
        const t = moveStepRef.current / MOVE_FRAMES;
        const dx = p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0;
        const dy = p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0;
        p.pxOffsetX = dx * ts * t;
        p.pxOffsetY = dy * ts * t;
        if (moveStepRef.current >= MOVE_FRAMES) {
          p.x += dx;
          p.y += dy;
          p.pxOffsetX = 0;
          p.pxOffsetY = 0;
          p.moving = false;
          // 押しっぱなしなら継続
          const held = heldDirRef.current;
          if (held) tryMove(held);
        }
      }

      // カメラ: プレイヤー中心、マップ端でクランプ
      const camCenterPxX = p.x * ts + p.pxOffsetX + ts / 2;
      const camCenterPxY = p.y * ts + p.pxOffsetY + ts / 2;
      let camX = camCenterPxX - cssW / 2;
      let camY = camCenterPxY - cssH / 2;
      const maxCamX = map.width * ts - cssW;
      const maxCamY = map.height * ts - cssH;
      camX = Math.max(0, Math.min(camX, Math.max(0, maxCamX)));
      camY = Math.max(0, Math.min(camY, Math.max(0, maxCamY)));

      // 描画範囲
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cssW, cssH);

      const startTx = Math.floor(camX / ts);
      const startTy = Math.floor(camY / ts);
      const endTx = Math.min(map.width, startTx + viewTilesX + 2);
      const endTy = Math.min(map.height, startTy + viewTilesY + 2);

      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const sx = tx * ts - camX;
          const sy = ty * ts - camY;
          const g = map.ground[ty][tx];
          ctx.fillStyle = GROUND_COLORS[g] ?? "#4a8f3f";
          ctx.fillRect(sx, sy, ts, ts);
          const o = map.objects[ty][tx];
          if (o && OBJECT_COLORS[o]) {
            ctx.fillStyle = OBJECT_COLORS[o];
            // 木・花は中央に小さく
            if (o === 8) {
              ctx.fillRect(sx + 4, sy + 2, ts - 8, ts - 4);
              ctx.fillStyle = "#1a4a1a";
              ctx.fillRect(sx + 12, sy + ts - 8, 8, 8);
            } else if (o === 7) {
              ctx.fillRect(sx + 12, sy + 12, 8, 8);
            } else if (o === 9) {
              ctx.fillRect(sx + 4, sy + 8, ts - 8, ts - 12);
            } else {
              ctx.fillRect(sx, sy, ts, ts);
            }
          }
        }
      }

      // プレイヤー描画 (16x16 中央配置の暫定キャラ)
      const px = p.x * ts + p.pxOffsetX - camX;
      const py = p.y * ts + p.pxOffsetY - camY;
      // 体
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(px + 8, py + 14, 16, 14);
      // 頭
      ctx.fillStyle = "#f4c894";
      ctx.fillRect(px + 10, py + 4, 12, 12);
      // 髪
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(px + 10, py + 4, 12, 4);
      // 向き表示 (目)
      ctx.fillStyle = "#000";
      if (p.dir === "down") {
        ctx.fillRect(px + 12, py + 10, 2, 2);
        ctx.fillRect(px + 18, py + 10, 2, 2);
      } else if (p.dir === "up") {
        // 後頭部 — 目なし、髪を厚く
        ctx.fillStyle = "#3a2a1a";
        ctx.fillRect(px + 10, py + 4, 12, 8);
      } else if (p.dir === "left") {
        ctx.fillRect(px + 11, py + 10, 2, 2);
      } else {
        ctx.fillRect(px + 19, py + 10, 2, 2);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [map, ts, cssW, cssH, viewTilesX, viewTilesY, tryMove]);

  // Canvas DPR対応
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    }
  }, [cssW, cssH]);

  // キーボード (PC開発用)
  useEffect(() => {
    const keyToDir = (k: string): Dir | null => {
      if (k === "ArrowUp" || k === "w") return "up";
      if (k === "ArrowDown" || k === "s") return "down";
      if (k === "ArrowLeft" || k === "a") return "left";
      if (k === "ArrowRight" || k === "d") return "right";
      return null;
    };
    const onDown = (e: KeyboardEvent) => {
      const d = keyToDir(e.key);
      if (!d) return;
      e.preventDefault();
      heldDirRef.current = d;
      tryMove(d);
    };
    const onUp = (e: KeyboardEvent) => {
      const d = keyToDir(e.key);
      if (!d) return;
      if (heldDirRef.current === d) heldDirRef.current = null;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [tryMove]);

  // DPad ハンドラ (タッチ)
  const pressDir = (d: Dir) => {
    heldDirRef.current = d;
    tryMove(d);
  };
  const releaseDir = (d: Dir) => {
    if (heldDirRef.current === d) heldDirRef.current = null;
  };

  const padBtn = "select-none w-12 h-12 rounded-lg bg-black/60 text-white flex items-center justify-center text-xl font-bold active:bg-black/80 touch-none";

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-lg"
        style={{ imageRendering: "pixelated" }}
      />
      {/* 仮想十字キー */}
      <div className="grid grid-cols-3 gap-1 w-44 select-none" style={{ touchAction: "none" }}>
        <div />
        <button
          className={padBtn}
          onTouchStart={(e) => { e.preventDefault(); pressDir("up"); }}
          onTouchEnd={(e) => { e.preventDefault(); releaseDir("up"); }}
          onMouseDown={() => pressDir("up")}
          onMouseUp={() => releaseDir("up")}
          onMouseLeave={() => releaseDir("up")}
          aria-label="上"
        >↑</button>
        <div />
        <button
          className={padBtn}
          onTouchStart={(e) => { e.preventDefault(); pressDir("left"); }}
          onTouchEnd={(e) => { e.preventDefault(); releaseDir("left"); }}
          onMouseDown={() => pressDir("left")}
          onMouseUp={() => releaseDir("left")}
          onMouseLeave={() => releaseDir("left")}
          aria-label="左"
        >←</button>
        <div />
        <button
          className={padBtn}
          onTouchStart={(e) => { e.preventDefault(); pressDir("right"); }}
          onTouchEnd={(e) => { e.preventDefault(); releaseDir("right"); }}
          onMouseDown={() => pressDir("right")}
          onMouseUp={() => releaseDir("right")}
          onMouseLeave={() => releaseDir("right")}
          aria-label="右"
        >→</button>
        <div />
        <button
          className={padBtn}
          onTouchStart={(e) => { e.preventDefault(); pressDir("down"); }}
          onTouchEnd={(e) => { e.preventDefault(); releaseDir("down"); }}
          onMouseDown={() => pressDir("down")}
          onMouseUp={() => releaseDir("down")}
          onMouseLeave={() => releaseDir("down")}
          aria-label="下"
        >↓</button>
        <div />
      </div>
    </div>
  );
};

export default TileMapCanvas;