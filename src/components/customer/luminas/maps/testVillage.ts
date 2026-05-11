// テスト用マップ: リヴェル村プロトタイプ
// タイルセット (4x4 = 16タイル, 各32px):
//   0=草地, 1=道, 2=水, 3=花畑, 4=石壁, 5=木壁, 6=木床, 7=石床,
//   8=木, 9=岩, 10=屋根, 11=扉, 12=宝箱, 13=看板, 14=石畳, 15=砂地
// objects レイヤーで使う主なID: 8(木), 9(岩), 10(屋根), 11(扉), 12(宝箱), 13(看板), 4(石壁), 5(木壁)

export interface TileMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  ground: number[][];
  objects: number[][]; // 0 = なし
  collision: number[][]; // 1 = 通行不可
  spawn: { x: number; y: number };
}

const W = 20;
const H = 20;

const fill = (v: number) => Array.from({ length: H }, () => Array.from({ length: W }, () => v));

const ground = fill(0);
// 石畳の十字路
for (let y = 0; y < H; y++) ground[y][10] = 14;
for (let x = 0; x < W; x++) ground[10][x] = 14;
// 池 (左上)
for (let y = 3; y < 6; y++) for (let x = 3; x < 6; x++) ground[y][x] = 2;
// 花畑 (建物まわり)
const flowerPatches: [number, number][] = [
  [2, 13], [6, 13], [2, 16], [6, 16],
  [13, 2], [17, 2], [13, 5], [17, 5],
  [13, 13], [14, 13], [15, 13], [16, 13],
];
flowerPatches.forEach(([x, y]) => { ground[y][x] = 3; });
// 砂地 (広場)
for (let y = 11; y <= 13; y++) for (let x = 11; x <= 13; x++) ground[y][x] = 15;

const objects = fill(0);
// 家A (左下) — 屋根 + 壁 + 扉
objects[14][3] = 10; objects[14][4] = 10; objects[14][5] = 10;
objects[15][3] = 5;  objects[15][4] = 11; objects[15][5] = 5;
// 家B (右上)
objects[3][14] = 10; objects[3][15] = 10; objects[3][16] = 10;
objects[4][14] = 5;  objects[4][15] = 11; objects[4][16] = 5;
// 家C (右下) — 大きめ
objects[14][14] = 10; objects[14][15] = 10; objects[14][16] = 10;
objects[15][14] = 5;  objects[15][15] = 11; objects[15][16] = 5;
// 木 (自然な配置)
const trees: [number, number][] = [
  [1, 1], [1, 18], [18, 1], [18, 18],
  [7, 2], [2, 7], [12, 7], [7, 12],
  [1, 8], [8, 1], [18, 8], [8, 18],
];
trees.forEach(([x, y]) => { objects[y][x] = 8; });
// 岩
const rocks: [number, number][] = [[17, 8], [8, 17], [3, 17], [17, 3]];
rocks.forEach(([x, y]) => { objects[y][x] = 9; });
// 看板 (村入口)
objects[11][9] = 13;
// 宝箱
objects[2][2] = 12;

// 衝突: 水・木・岩・壁・屋根は通行不可、扉は通行可
const collision = fill(0);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const g = ground[y][x];
    const o = objects[y][x];
    if (g === 2) collision[y][x] = 1;
    // 壁・木・岩・屋根は通行不可。扉(11)・宝箱(12)・看板(13)は通行可（後でイベント対応）。
    if (o === 4 || o === 5 || o === 8 || o === 9 || o === 10) collision[y][x] = 1;
  }
}
// マップ外周は柵代わりに通行不可にしない（端で止まる処理は移動側で）

export const testVillage: TileMap = {
  id: "rivel_test",
  name: "リヴェル村 (テスト)",
  width: W,
  height: H,
  tileSize: 32,
  ground,
  objects,
  collision,
  spawn: { x: 10, y: 12 },
};