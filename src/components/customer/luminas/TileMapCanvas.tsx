import { useEffect, useRef, useState, useCallback } from "react";
import type { TileMap } from "./maps/testVillage";

// === 画像URL (Supabase Storage) ===
const TILESET_URL = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/rpg/tileset.png";
const HERO_URL = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/rpg/hero_sprite.png";
const NPC_URL = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/rpg/npc_sprites.png";

const SRC_TILE = 32; // スプライトシート上のタイル/フレームサイズ

// === タイルID -> (col,row) on tileset (4x4) ===
const TILE_POS: Record<number, [number, number]> = {
  0: [0, 0], 1: [1, 0], 2: [2, 0], 3: [3, 0],
  4: [0, 1], 5: [1, 1], 6: [2, 1], 7: [3, 1],
  8: [0, 2], 9: [1, 2], 10: [2, 2], 11: [3, 2],
  12: [0, 3], 13: [1, 3], 14: [2, 3], 15: [3, 3],
};

// === フォールバック色 ===
const FALLBACK_GROUND: Record<number, string> = {
  0: "#4a8f3f", 1: "#c4a55a", 2: "#3a7ecf", 3: "#d97aa8",
  6: "#d4a76a", 7: "#a0a0a0", 14: "#8a8a8a", 15: "#e6d29a",
};
const FALLBACK_OBJECT: Record<number, string> = {
  4: "#7a7a7a", 5: "#8b5e3c", 8: "#2d6b2d", 9: "#5a5a5a",
  10: "#c04040", 11: "#6b4226", 12: "#d4a017", 13: "#8b5e3c",
};

type Dir = "down" | "up" | "left" | "right";
const DIR_ROW: Record<Dir, number> = { down: 0, left: 1, right: 2, up: 3 };

interface PlayerState {
  x: number; y: number;
  pxOffsetX: number; pxOffsetY: number;
  dir: Dir; moving: boolean;
}

const MOVE_FRAMES = 8;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed: " + src));
    img.src = src;
  });

interface Props {
  map: TileMap;
  viewTilesX?: number;
  viewTilesY?: number;
}

const TileMapCanvas = ({ map, viewTilesX = 11, viewTilesY = 13 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<PlayerState>({
    x: map.spawn.x, y: map.spawn.y,
    pxOffsetX: 0, pxOffsetY: 0,
    dir: "down", moving: false,
  });
  const moveStepRef = useRef(0);
  const heldDirRef = useRef<Dir | null>(null);
  const walkPhaseRef = useRef(0); // 歩行アニメ位相
  const [, forceTick] = useState(0);

  const tilesetRef = useRef<HTMLImageElement | null>(null);
  const heroRef = useRef<HTMLImageElement | null>(null);
  const npcRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const ts = map.tileSize;
  const cssW = viewTilesX * ts;
  const cssH = viewTilesY * ts;

  // 画像プリロード
  useEffect(() => {
    let alive = true;
    Promise.all([loadImage(TILESET_URL), loadImage(HERO_URL), loadImage(NPC_URL)])
      .then(([tile, hero, npc]) => {
        if (!alive) return;
        tilesetRef.current = tile;
        heroRef.current = hero;
        npcRef.current = npc;
        setLoaded(true);
      })
      .catch((e) => {
        if (!alive) return;
        // フォールバック描画で続行
        setLoadError(e.message);
        setLoaded(true);
      });
    return () => { alive = false; };
  }, []);

  const canEnter = useCallback((tx: number, ty: number): boolean => {
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return false;
    return map.collision[ty][tx] === 0;
  }, [map]);

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
      forceTick((v) => v + 1);
      return;
    }
    p.moving = true;
    moveStepRef.current = 0;
  }, [canEnter]);

  // 描画ループ
  useEffect(() => {
    if (!loaded) return;
    let raf = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(loop); return; }

      const p = playerRef.current;

      if (p.moving) {
        moveStepRef.current += 1;
        const t = moveStepRef.current / MOVE_FRAMES;
        const dx = p.dir === "left" ? -1 : p.dir === "right" ? 1 : 0;
        const dy = p.dir === "up" ? -1 : p.dir === "down" ? 1 : 0;
        p.pxOffsetX = dx * ts * t;
        p.pxOffsetY = dy * ts * t;
        if (moveStepRef.current >= MOVE_FRAMES) {
          p.x += dx; p.y += dy;
          p.pxOffsetX = 0; p.pxOffsetY = 0;
          p.moving = false;
          walkPhaseRef.current = (walkPhaseRef.current + 1) % 2;
          const held = heldDirRef.current;
          if (held) tryMove(held);
        }
      }

      const camCenterPxX = p.x * ts + p.pxOffsetX + ts / 2;
      const camCenterPxY = p.y * ts + p.pxOffsetY + ts / 2;
      let camX = camCenterPxX - cssW / 2;
      let camY = camCenterPxY - cssH / 2;
      const maxCamX = map.width * ts - cssW;
      const maxCamY = map.height * ts - cssH;
      camX = Math.max(0, Math.min(camX, Math.max(0, maxCamX)));
      camY = Math.max(0, Math.min(camY, Math.max(0, maxCamY)));

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cssW, cssH);

      const startTx = Math.floor(camX / ts);
      const startTy = Math.floor(camY / ts);
      const endTx = Math.min(map.width, startTx + viewTilesX + 2);
      const endTy = Math.min(map.height, startTy + viewTilesY + 2);

      const tileImg = tilesetRef.current;

      const drawTile = (id: number, sx: number, sy: number, isObject: boolean) => {
        const pos = TILE_POS[id];
        if (tileImg && pos) {
          ctx.drawImage(tileImg, pos[0] * SRC_TILE, pos[1] * SRC_TILE, SRC_TILE, SRC_TILE, sx, sy, ts, ts);
        } else {
          // フォールバック
          const color = isObject ? FALLBACK_OBJECT[id] : FALLBACK_GROUND[id];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(sx, sy, ts, ts);
          }
        }
      };

      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const sx = tx * ts - camX;
          const sy = ty * ts - camY;
          drawTile(map.ground[ty][tx], sx, sy, false);
          const o = map.objects[ty][tx];
          if (o) drawTile(o, sx, sy, true);
        }
      }

      // プレイヤー描画
      const px = p.x * ts + p.pxOffsetX - camX;
      const py = p.y * ts + p.pxOffsetY - camY;
      const heroImg = heroRef.current;
      if (heroImg) {
        // 移動中は歩きフレーム1/2を交互、停止中は立ち
        let frameCol = 0;
        if (p.moving) {
          const half = MOVE_FRAMES / 2;
          frameCol = moveStepRef.current < half ? 1 : 2;
          // walkPhaseRefで踏み出す足を切替
          if (walkPhaseRef.current === 1) frameCol = frameCol === 1 ? 2 : 1;
        }
        const row = DIR_ROW[p.dir];
        ctx.drawImage(heroImg, frameCol * SRC_TILE, row * SRC_TILE, SRC_TILE, SRC_TILE, px, py, ts, ts);
      } else {
        // フォールバック (色キャラ)
        ctx.fillStyle = "#1e3a8a";
        ctx.fillRect(px + 8, py + 14, 16, 14);
        ctx.fillStyle = "#f4c894";
        ctx.fillRect(px + 10, py + 4, 12, 12);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [loaded, map, ts, cssW, cssH, viewTilesX, viewTilesY, tryMove]);

  // Canvas DPR + サイズ
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

  // キーボード
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

  const pressDir = (d: Dir) => { heldDirRef.current = d; tryMove(d); };
  const releaseDir = (d: Dir) => { if (heldDirRef.current === d) heldDirRef.current = null; };

  const padBtn = "select-none w-14 h-14 rounded-lg bg-black/60 text-white flex items-center justify-center text-2xl font-bold active:bg-black/80 touch-none";

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64 text-sm opacity-70">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {loadError && (
        <p className="text-[10px] text-yellow-600 break-all px-2">
          画像読込失敗のためフォールバック描画中
        </p>
      )}
      <canvas
        ref={canvasRef}
        className="rounded-lg shadow-lg"
        style={{
          imageRendering: "pixelated",
        }}
      />
      <div className="grid grid-cols-3 gap-1 w-52 select-none" style={{ touchAction: "none" }}>
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