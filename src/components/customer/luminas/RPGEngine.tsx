import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import type { Direction, GameMap, MapNPC } from "./maps/rivelVillage";

// === 画像URL (Supabase Storage) ===
const TILESET_URL = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/rpg/tileset.png";
const HERO_URL = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/rpg/hero_sprite.png";
const NPC_URL = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/rpg/npc_sprites.png";

const SRC_TILE = 32;
const TILE_SIZE = 32;
const VIEWPORT_COLS = 11;
const VIEWPORT_ROWS = 11;
const MOVE_FRAMES = 8;

// タイルID → スプライトシート (col,row)
const TILE_POS: Record<number, [number, number]> = {
  0: [0, 0], 1: [1, 0], 2: [2, 0], 3: [3, 0],
  4: [0, 1], 5: [1, 1], 6: [2, 1], 7: [3, 1],
  8: [0, 2], 9: [1, 2], 10: [2, 2], 11: [3, 2],
  12: [0, 3], 13: [1, 3], 14: [2, 3], 15: [3, 3],
};

const FALLBACK_TILE_COLOR: Record<number, string> = {
  0: "#4a8f3f", 1: "#c4a55a", 2: "#3a7ecf", 3: "#7a7a7a",
  4: "#8b5e3c", 5: "#d4a76a", 6: "#a0a0a0", 7: "#5aaf4f",
  8: "#2d6b2d", 9: "#5a5a5a", 10: "#c04040", 11: "#6b4226",
  12: "#d4a017", 13: "#8b5e3c", 14: "#8a8a8a", 15: "#e6d29a",
};

const DIR_ROW: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

interface PlayerState {
  x: number; y: number;
  pxOffsetX: number; pxOffsetY: number;
  direction: Direction;
  isMoving: boolean;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed: " + src));
    img.src = src;
  });

interface Props {
  map: GameMap;
  onExit: () => void;
}

const RPGEngine = ({ map, onExit }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const playerRef = useRef<PlayerState>({
    x: map.spawn.x,
    y: map.spawn.y,
    pxOffsetX: 0,
    pxOffsetY: 0,
    direction: map.spawn.direction,
    isMoving: false,
  });
  const moveStepRef = useRef(0);
  const heldDirRef = useRef<Direction | null>(null);
  const walkPhaseRef = useRef(0);

  const tilesetRef = useRef<HTMLImageElement | null>(null);
  const heroRef = useRef<HTMLImageElement | null>(null);
  const npcRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [, force] = useState(0);
  const tick = () => force((v) => v + 1);

  // ダイアログ・メニュー状態
  const [dialogue, setDialogue] = useState<{ npc: MapNPC; index: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const cssW = VIEWPORT_COLS * TILE_SIZE;
  const cssH = VIEWPORT_ROWS * TILE_SIZE;

  // === 画像プリロード ===
  useEffect(() => {
    let alive = true;
    Promise.all([loadImage(TILESET_URL), loadImage(HERO_URL), loadImage(NPC_URL)])
      .then(([t, h, n]) => {
        if (!alive) return;
        tilesetRef.current = t;
        heroRef.current = h;
        npcRef.current = n;
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setLoaded(true);
      });
    return () => { alive = false; };
  }, []);

  // === 衝突判定 ===
  const isBlocked = useCallback((tx: number, ty: number): boolean => {
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
    if (map.layers.collision[ty][tx] === 1) return true;
    if (map.npcs.some((n) => n.x === tx && n.y === ty)) return true;
    return false;
  }, [map]);

  // === 前方タイル ===
  const facingTile = useCallback((p: PlayerState): [number, number] => {
    let nx = p.x, ny = p.y;
    if (p.direction === "up") ny -= 1;
    else if (p.direction === "down") ny += 1;
    else if (p.direction === "left") nx -= 1;
    else if (p.direction === "right") nx += 1;
    return [nx, ny];
  }, []);

  // === 移動開始 ===
  const tryMove = useCallback((dir: Direction) => {
    const p = playerRef.current;
    if (p.isMoving || dialogue || menuOpen) return;
    p.direction = dir;
    let nx = p.x, ny = p.y;
    if (dir === "up") ny -= 1;
    else if (dir === "down") ny += 1;
    else if (dir === "left") nx -= 1;
    else if (dir === "right") nx += 1;
    if (isBlocked(nx, ny)) {
      tick();
      return;
    }
    p.isMoving = true;
    moveStepRef.current = 0;
  }, [isBlocked, dialogue, menuOpen]);

  // === Aボタン: 話しかける/ダイアログ進行 ===
  const handleAction = useCallback(() => {
    if (menuOpen) return;
    if (dialogue) {
      const next = dialogue.index + 1;
      if (next >= dialogue.npc.dialogues.length) {
        setDialogue(null);
      } else {
        setDialogue({ npc: dialogue.npc, index: next });
      }
      return;
    }
    const p = playerRef.current;
    const [fx, fy] = facingTile(p);
    const npc = map.npcs.find((n) => n.x === fx && n.y === fy);
    if (npc) {
      setDialogue({ npc, index: 0 });
    }
  }, [dialogue, menuOpen, facingTile, map.npcs]);

  // === 描画ループ ===
  useEffect(() => {
    if (!loaded) return;
    let raf = 0;
    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(loop); return; }

      const p = playerRef.current;

      // 移動アニメ
      if (p.isMoving) {
        moveStepRef.current += 1;
        const t = moveStepRef.current / MOVE_FRAMES;
        const dx = p.direction === "left" ? -1 : p.direction === "right" ? 1 : 0;
        const dy = p.direction === "up" ? -1 : p.direction === "down" ? 1 : 0;
        p.pxOffsetX = dx * TILE_SIZE * t;
        p.pxOffsetY = dy * TILE_SIZE * t;
        if (moveStepRef.current >= MOVE_FRAMES) {
          p.x += dx; p.y += dy;
          p.pxOffsetX = 0; p.pxOffsetY = 0;
          p.isMoving = false;
          walkPhaseRef.current = (walkPhaseRef.current + 1) % 2;
          const held = heldDirRef.current;
          if (held && !dialogue && !menuOpen) {
            // 継続移動
            p.direction = held;
            let nx = p.x, ny = p.y;
            if (held === "up") ny -= 1;
            else if (held === "down") ny += 1;
            else if (held === "left") nx -= 1;
            else if (held === "right") nx += 1;
            if (!isBlocked(nx, ny)) {
              p.isMoving = true;
              moveStepRef.current = 0;
            }
          }
        }
      }

      // カメラ
      const camCenterX = p.x * TILE_SIZE + p.pxOffsetX + TILE_SIZE / 2;
      const camCenterY = p.y * TILE_SIZE + p.pxOffsetY + TILE_SIZE / 2;
      const maxCamX = Math.max(0, map.width * TILE_SIZE - cssW);
      const maxCamY = Math.max(0, map.height * TILE_SIZE - cssH);
      const camX = Math.max(0, Math.min(camCenterX - cssW / 2, maxCamX));
      const camY = Math.max(0, Math.min(camCenterY - cssH / 2, maxCamY));

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, cssW, cssH);

      const startTx = Math.floor(camX / TILE_SIZE);
      const startTy = Math.floor(camY / TILE_SIZE);
      const endTx = Math.min(map.width, startTx + VIEWPORT_COLS + 2);
      const endTy = Math.min(map.height, startTy + VIEWPORT_ROWS + 2);

      const tileImg = tilesetRef.current;
      const drawTile = (id: number, sx: number, sy: number) => {
        const pos = TILE_POS[id];
        if (tileImg && pos) {
          ctx.drawImage(tileImg, pos[0] * SRC_TILE, pos[1] * SRC_TILE, SRC_TILE, SRC_TILE, sx, sy, TILE_SIZE, TILE_SIZE);
        } else {
          const c = FALLBACK_TILE_COLOR[id];
          if (c) {
            ctx.fillStyle = c;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
          }
        }
      };

      // タイル描画 (ground -> objects)
      for (let ty = startTy; ty < endTy; ty++) {
        for (let tx = startTx; tx < endTx; tx++) {
          const sx = tx * TILE_SIZE - camX;
          const sy = ty * TILE_SIZE - camY;
          drawTile(map.layers.ground[ty][tx], sx, sy);
          const o = map.layers.objects[ty][tx];
          if (o) drawTile(o, sx, sy);
        }
      }

      // NPC描画
      const npcImg = npcRef.current;
      for (const npc of map.npcs) {
        if (npc.x < startTx - 1 || npc.x > endTx || npc.y < startTy - 1 || npc.y > endTy) continue;
        const sx = npc.x * TILE_SIZE - camX;
        const sy = npc.y * TILE_SIZE - camY;
        if (npcImg) {
          const row = DIR_ROW[npc.direction];
          ctx.drawImage(npcImg, npc.spriteIndex * SRC_TILE, row * SRC_TILE, SRC_TILE, SRC_TILE, sx, sy, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = npc.color;
          ctx.fillRect(sx + 8, sy + 4, 16, 24);
        }
      }

      // プレイヤー描画
      const px = p.x * TILE_SIZE + p.pxOffsetX - camX;
      const py = p.y * TILE_SIZE + p.pxOffsetY - camY;
      const heroImg = heroRef.current;
      if (heroImg) {
        let frameCol = 0;
        if (p.isMoving) {
          const half = MOVE_FRAMES / 2;
          frameCol = moveStepRef.current < half ? 1 : 2;
          if (walkPhaseRef.current === 1) frameCol = frameCol === 1 ? 2 : 1;
        }
        const row = DIR_ROW[p.direction];
        ctx.drawImage(heroImg, frameCol * SRC_TILE, row * SRC_TILE, SRC_TILE, SRC_TILE, px, py, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = "#1e3a8a";
        ctx.fillRect(px + 8, py + 14, 16, 14);
        ctx.fillStyle = "#f4c894";
        ctx.fillRect(px + 10, py + 4, 12, 12);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [loaded, map, cssW, cssH, isBlocked, dialogue, menuOpen]);

  // Canvas DPR
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
    const keyToDir = (k: string): Direction | null => {
      if (k === "ArrowUp" || k === "w") return "up";
      if (k === "ArrowDown" || k === "s") return "down";
      if (k === "ArrowLeft" || k === "a") return "left";
      if (k === "ArrowRight" || k === "d") return "right";
      return null;
    };
    const onDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "z") {
        e.preventDefault();
        handleAction();
        return;
      }
      if (e.key === "Escape") {
        if (dialogue) setDialogue(null);
        else setMenuOpen((v) => !v);
        return;
      }
      const d = keyToDir(e.key);
      if (!d) return;
      e.preventDefault();
      heldDirRef.current = d;
      tryMove(d);
    };
    const onUp = (e: KeyboardEvent) => {
      const d = keyToDir(e.key);
      if (d && heldDirRef.current === d) heldDirRef.current = null;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [tryMove, handleAction, dialogue]);

  const pressDir = (d: Direction) => { heldDirRef.current = d; tryMove(d); };
  const releaseDir = (d: Direction) => { if (heldDirRef.current === d) heldDirRef.current = null; };

  const dirBtn = "w-14 h-14 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center active:bg-white/40 touch-none select-none";
  const dirHandlers = (d: Direction) => ({
    onTouchStart: (e: React.TouchEvent) => { e.preventDefault(); pressDir(d); },
    onTouchEnd: (e: React.TouchEvent) => { e.preventDefault(); releaseDir(d); },
    onMouseDown: () => pressDir(d),
    onMouseUp: () => releaseDir(d),
    onMouseLeave: () => releaseDir(d),
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center overflow-hidden select-none" style={{ touchAction: "none" }}>
      {/* 上部バー */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
        <p className="text-xs text-white/80 font-bold break-all">{map.name}</p>
        <button
          onClick={() => setMenuOpen(true)}
          className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center active:bg-white/40"
          aria-label="メニュー"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Canvas (中央寄せ・縦中央) */}
      <div className="flex-1 flex items-center justify-center w-full pt-10 pb-44">
        {!loaded ? (
          <p className="text-white/70 text-sm">Loading...</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-2xl"
            style={{ imageRendering: "pixelated" }}
          />
        )}
      </div>

      {/* ダイアログ */}
      {dialogue && (
        <div
          className="absolute left-2 right-2 bottom-44 z-20 bg-black/85 border-2 border-white/40 rounded-lg p-3 cursor-pointer"
          onClick={handleAction}
        >
          <p className="text-[11px] text-yellow-300 font-bold mb-1 break-all">{dialogue.npc.name}</p>
          <p className="text-sm text-white leading-relaxed break-all">{dialogue.npc.dialogues[dialogue.index]}</p>
          <p className="text-[10px] text-white/60 mt-2 text-right">タップで次へ ▼</p>
        </div>
      )}

      {/* DPad + Aボタン */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10" style={{ touchAction: "none" }}>
        <div className="relative" style={{ width: 168, height: 168 }}>
          <button {...dirHandlers("up")} className={`absolute top-0 left-1/2 -translate-x-1/2 ${dirBtn}`} aria-label="上">
            <ChevronUp className="w-7 h-7 text-white" />
          </button>
          <button {...dirHandlers("down")} className={`absolute bottom-0 left-1/2 -translate-x-1/2 ${dirBtn}`} aria-label="下">
            <ChevronDown className="w-7 h-7 text-white" />
          </button>
          <button {...dirHandlers("left")} className={`absolute left-0 top-1/2 -translate-y-1/2 ${dirBtn}`} aria-label="左">
            <ChevronLeft className="w-7 h-7 text-white" />
          </button>
          <button {...dirHandlers("right")} className={`absolute right-0 top-1/2 -translate-y-1/2 ${dirBtn}`} aria-label="右">
            <ChevronRight className="w-7 h-7 text-white" />
          </button>
          <button
            onTouchStart={(e) => { e.preventDefault(); handleAction(); }}
            onMouseDown={() => handleAction()}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-amber-500/70 backdrop-blur flex items-center justify-center text-white font-bold text-lg active:bg-amber-500 touch-none select-none"
            aria-label="決定"
          >
            A
          </button>
        </div>
      </div>

      {/* メニュー */}
      {menuOpen && (
        <div className="absolute inset-0 z-30 bg-black/80 flex items-center justify-center px-6">
          <div className="w-full max-w-xs bg-zinc-900 border-2 border-white/30 rounded-xl p-4 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-bold text-sm">メニュー</p>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center"
                aria-label="閉じる"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <button disabled className="w-full text-left px-3 py-2 text-sm text-white/40 rounded-lg">つよさ (準備中)</button>
            <button disabled className="w-full text-left px-3 py-2 text-sm text-white/40 rounded-lg">もちもの (準備中)</button>
            <button disabled className="w-full text-left px-3 py-2 text-sm text-white/40 rounded-lg">そうび (準備中)</button>
            <button disabled className="w-full text-left px-3 py-2 text-sm text-white/40 rounded-lg">セーブ (準備中)</button>
            <div className="h-px bg-white/20 my-2" />
            <button
              onClick={onExit}
              className="w-full text-left px-3 py-2 text-sm text-white bg-red-600/80 rounded-lg active:bg-red-600"
            >
              アプリに戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RPGEngine;