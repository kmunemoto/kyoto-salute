## ライバルバトルシステム実装計画

会員同士が匿名で1対1の週間バトルを行う仕組みを構築します。範囲が大きいため、3つのフェーズで進めます。

---

### フェーズ1：データベース基盤（マイグレーション）

新規テーブル3つを作成し、RLSとRPC関数を整備します。

**テーブル**
- `rival_battles`：対戦カード（player1/2、挙上量、勝者、status）
- `rival_battle_entries`：週次エントリー（user_id、week_start、matched）
- `rival_battle_rewards`：報酬（result、coins、exp、win_streak、claimed）

**注意点**：仕様書では `profiles(id)` を参照とありますが、本プロジェクトでは `user_id`（auth uid）を一貫して使うため、外部キーは付けず `user_id uuid NOT NULL` とします（既存テーブルと同じ規約）。

**RLSポリシー**
- 自分のレコードのみSELECT/INSERT/UPDATE
- トレーナー（`has_role(auth.uid(), 'trainer')`）は全レコード閲覧可

**RPC関数（SECURITY DEFINER）**
- `enter_rival_battle()`：JST月曜のみエントリー可
- `run_rival_matching(week_start)`：同性 × アバターレベル近い順でペアリング
- `update_rival_battle_volumes(week_start)`：`workouts` テーブルから期間中の総挙上量を集計（jsonb sets と weight×reps の両対応 = `get_ranking` と同じロジックを流用）
- `complete_rival_battles(week_start)`：勝敗確定 + 連勝計算 + 報酬レコード作成
- `claim_rival_reward(battle_id)`：コイン/EXPを実付与しclaimed=true

---

### フェーズ2：お客様向けUI

**新規ファイル**
- `src/hooks/useRivalBattle.ts`：今週のエントリー・進行中バトル・未claim報酬を取得
- `src/components/customer/RivalBattleCard.tsx`：ホーム画面用カード（A〜F の状態分岐）
- `src/components/customer/RivalBattleDetailDialog.tsx`：詳細表示（履歴・通算戦績・連勝数）

**変更ファイル**
- `src/components/customer/CustomerHome.tsx`：「次回の予約」直下に `<RivalBattleCard />` を挿入

カードの状態分岐：
- A: 月曜かつ未エントリー → エントリーボタン
- B: エントリー済みマッチング待ち → ローディング
- C: バトル進行中 → VS画面 + 挙上量比較プログレスバー + 残り日数
- D: 結果あり未claim → WIN/LOSE/DRAW 演出 + 報酬受け取りボタン
- E: マッチング不成立 / エントリー期間外 → 案内
- F: 月曜以外で対象なし → 非表示

---

### フェーズ3：トレーナー管理画面

**新規ファイル**
- `src/components/trainer/TrainerRivalBattleManager.tsx`

**変更ファイル**
- `src/components/trainer/TrainerSidebar.tsx`：「バトル管理」メニュー追加
- `src/components/trainer/TrainerView.tsx`：ルーティング追加

機能：
- 今週のバトル一覧（プレイヤー名、進行状況、挙上量）
- 「マッチング実行」「結果確定」「挙上量更新」ボタン
- 過去の週のバトル結果一覧

---

### デザイン

- メインカラー：`#0ABAB5`（既存のティファニーブルー、index.cssのトークンを使用）
- アイコン：`Swords`, `Trophy`, `Shield`, `Flame`（Lucide React）
- 絵文字なし、日本語表記
- モバイルファースト（max-w-md内に収まる）

---

### 確認事項

1. 自動実行（cron）は今回は組み込まず、トレーナー画面からの手動実行のみで運用する想定でよいか？（仕様書にもそう記載あり）
2. アバター画像の表示は、既存の `getAvatarImage(rank, gender, hairColor)` を流用してOKか？
3. 連勝判定は「直近の連続勝利数」（敗北/引き分けでリセット）の解釈でよいか？

問題なければこの計画で着手します。
