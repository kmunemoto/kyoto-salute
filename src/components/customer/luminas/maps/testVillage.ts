// テスト用マップ: リヴェル村プロトタイプ (Prompt 1 用の簡易版)
// 後続のPromptで本格的な村マップに差し替える。
// タイルID:
//   0=草, 1=道, 2=水, 3=石壁, 4=木壁, 5=床(木), 6=床(石),
//   7=花, 8=木, 9=岩, 10=屋根, 11=扉, 12=宝箱, 13=看板

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
// 縦の道
for (let y = 0; y < H; y++) ground[y][10] = 1;
// 横の道
for (let x = 0; x < W; x++) ground[10][x] = 1;
// 池
for (let y = 3; y < 6; y++) for (let x = 3; x < 6; x++) ground[y][x] = 2;

const objects = fill(0);
// 家1 (左下)
objects[14][3] = 10; objects[14][4] = 10; objects[14][5] = 10;
objects[15][3] = 4;  objects[15][4] = 11; objects[15][5] = 4;
// 家2 (右上)
objects[3][14] = 10; objects[3][15] = 10; objects[3][16] = 10;
objects[4][14] = 4;  objects[4][15] = 11; objects[4][16] = 4;
// 木
const trees: [number, number][] = [[1,1],[1,18],[18,1],[18,18],[7,2],[2,7],[16,12],[12,16]];
trees.forEach(([x, y]) => { objects[y][x] = 8; });
// 花
const flowers: [number, number][] = [[6,11],[7,11],[12,9],[13,9]];
flowers.forEach(([x, y]) => { objects[y][x] = 7; });
// 岩
objects[8][17] = 9;
objects[17][8] = 9;

// 衝突: 水・木・岩・壁・屋根は通行不可、扉は通行可
const collision = fill(0);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const g = ground[y][x];
    const o = objects[y][x];
    if (g === 2) collision[y][x] = 1;
    if (o === 4 || o === 8 || o === 9 || o === 10 || o === 3) collision[y][x] = 1;
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