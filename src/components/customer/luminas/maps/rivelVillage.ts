// リヴェル村 (Prompt 1 仕様の 15x15 テスト版)
// タイルID:
// 0=草地, 1=道, 2=水, 3=石壁, 4=木壁, 5=木床, 6=石床, 7=花畑,
// 8=木, 9=岩, 10=屋根, 11=扉, 12=宝箱, 13=看板,
// 14=石畳(将来), 15=砂地(将来)

export type Direction = "up" | "down" | "left" | "right";

export interface MapNPC {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;
  /** NPCスプライトシート上の列 (0..3) */
  spriteIndex: number;
  /** 画像未ロード時のフォールバック色 */
  color: string;
  dialogues: string[];
  condition?: string;
}

export interface MapWarp {
  x: number; y: number;
  targetMap: string; targetX: number; targetY: number;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    ground: number[][];
    objects: number[][];
    collision: number[][];
  };
  encounterRate: number;
  npcs: MapNPC[];
  warps: MapWarp[];
  spawn: { x: number; y: number; direction: Direction };
}

const ground: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,8,8,0,0,1,0,0,8,8,0,0,0],
  [0,0,0,8,8,0,1,1,1,0,8,8,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,7,1,0,0,0,0,1,0],
  [0,1,0,10,10,0,1,2,1,0,10,10,0,1,0],
  [0,1,0,4,4,0,1,1,1,0,4,4,0,1,0],
  [0,1,0,4,11,0,1,1,1,0,11,4,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
];

const objects: number[][] = Array.from({ length: 15 }, () => Array(15).fill(0));

const collision: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,1,0,0,1,1,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,1,1,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,0,0,0,1,1,1,1,1,1],
];

export const rivelVillage: GameMap = {
  id: "rivel_village",
  name: "リヴェル村",
  width: 15,
  height: 15,
  tileSize: 32,
  layers: { ground, objects, collision },
  encounterRate: 0,
  spawn: { x: 7, y: 9, direction: "down" },
  npcs: [
    {
      id: "elder",
      name: "村長オルドス",
      x: 4, y: 3,
      direction: "down",
      spriteIndex: 0,
      color: "#e8c840",
      dialogues: [
        "おお、目が覚めたか。",
        "お前の母は…ルミナス王家の末裔だったのだ。",
        "7つの星石を集め、王国を復興させるのがお前の使命じゃ。",
      ],
    },
    {
      id: "girl",
      name: "エリナ",
      x: 8, y: 5,
      direction: "left",
      spriteIndex: 1,
      color: "#ff8090",
      dialogues: [
        "紋章が光ったって本当？すごい！",
        "気をつけてね、応援してる！",
      ],
    },
    {
      id: "oldman",
      name: "老人ゼフ",
      x: 7, y: 13,
      direction: "up",
      spriteIndex: 2,
      color: "#a0a0c0",
      dialogues: [
        "北は村じゃ。南に行くとフィールドに出るぞ。",
        "弱い魔物がおる。修行にちょうどいい。",
      ],
    },
  ],
  warps: [],
};