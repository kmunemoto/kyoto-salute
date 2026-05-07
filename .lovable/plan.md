## アバター育成システム フェーズ1 実装計画

### 1. データベース（マイグレーション1本）

**新規テーブル3つ + RLS**

- `user_avatars` (user_id UNIQUE, total_exp, level, coins)
- `avatar_exp_logs` (user_id, exp_amount, reason, reference_date)
  - UNIQUE `(user_id, reason, reference_date)` で二重獲得防止
  - INDEX `(user_id, created_at DESC)`
- `avatar_achievements` (user_id, achievement_key)
  - UNIQUE `(user_id, achievement_key)`

**RLS**: 自分のデータをSELECT/INSERT/UPDATE、トレーナーは全件SELECT。`updated_at`トリガー（user_avatars）。

### 2. ロジック層（新規ファイル）

**`src/lib/avatarSystem.ts`**
- `getRequiredExp(level)` / `calculateLevel(totalExp)` / `getRankInfo(level)` (5ランク + イメージパス)
- `getExpProgress(totalExp)` → `{ level, currentExp, nextExp, percent, rank }`

**`src/lib/avatarRewards.ts`**
- `awardExpForSession(userId, date, workouts)` — セッション完了/連続来店/自己ベスト/新種目/月間目標を判定し、`avatar_exp_logs` に upsert（onConflict→ignore）して `total_exp/level/coins` を再計算
- `checkAchievements(userId, workouts全件)` — 7種バッジを判定して `avatar_achievements` にinsert
- 戻り値で「新規獲得EXP合計、レベルアップ前後、新規バッジ」を返す

**`src/hooks/useAvatar.ts`**
- 自分の `user_avatars` を fetch、なければ作成。realtimeで更新検知。

### 3. UI

**`src/components/customer/AvatarCard.tsx`** — ホーム上部のカード（画像80px / Lv / ランク / EXPバー）。タップで詳細を開く。

**`src/components/customer/AvatarDetailDialog.tsx`** — フルスクリーンDialog
- 画像200px、Lv、ランク、累計EXP、大EXPバー
- EXP獲得履歴（直近10件）
- 実績バッジグリッド（獲得済みカラー / 未獲得グレー）

**`src/components/customer/AvatarLevelUpDialog.tsx`** — レベルアップ演出
- 中央大画像、「LEVEL UP!」アニメ、新Lv/ランク、+10コイン、キラキラ（CSS keyframes）

**`CustomerHome.tsx`** — 挨拶直下に `<AvatarCard>` を差し込み

**`CustomerTraining.tsx`** — 記録保存後（INSERT/UPDATE成功直後）に `awardExpForSession` + `checkAchievements` を呼び、新規EXP/レベルアップがあれば LevelUpDialog 表示

### 4. アバター画像（プレースホルダSVG）

`public/avatars/` に5枚のSVGを配置（rookie/regular/athlete/elite/legend）。各ランクの色 + イニシャル文字、legend のみ金色 + キラキラ。後日PNG差し替え可能。

### 5. 初回バックフィル

`useAvatar` 初回取得時、行が無ければ：
1. `user_avatars` を level1/0EXP で作成
2. 既存 `workouts` を日付順に走査して `awardExpForSession` を全日に対して実行（UNIQUE制約で冪等）
3. `checkAchievements` 実行
4. 最終 total_exp から level / coins を確定

### 技術詳細

- EXPルール
  - session: +100 / day（key: `session|YYYY-MM-DD`）
  - streak_bonus: +50 / 2週連続検知時（key: `streak_bonus|週末日付`）
  - personal_best: +30 / 種目×日（key: `pb|exerciseId|YYYY-MM-DD`）
  - new_exercise: +20 / 種目（key: `new_exercise|exerciseId|first-date`）
  - monthly_goal: +200 / 月（key: `monthly_goal|YYYY-MM-01`）
  - reference_date列とreasonの組み合わせをUNIQUEに使うため、`reason`に上記キー文字列をそのまま入れる
- コインはレベルアップ毎に+10付与（差分 = 新Lv - 旧Lv）
- 実績判定はクライアント側で全workoutsを集計

### 範囲外（フェーズ2以降）
- シェアカード統合
- 着せ替え/コイン使用
- トレーナー側の表示
