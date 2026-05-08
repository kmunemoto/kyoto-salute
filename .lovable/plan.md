## 概要

王国復興クエストを「条件達成方式」から「ボスバトル方式」に変更し、装備システムを追加。あわせてホームカードのタップ遷移バグを修正します。

---

## A. バグ修正（最優先・即時対応可）

1. `src/App.tsx` に `/quest` ルートが無いため、QuestCard タップ時の遷移が機能していません。現状はホームの内部タブ（CustomerView の `quest` タブ）に依存しています。
2. **対応方針**：URL ルーティングではなく既存の **CustomerView の内部タブ切替** を使用します（既存実装と整合）。`QuestCard` の `onOpen` が確実に `setActiveTab("quest")` を呼ぶよう CustomerHome から渡されているか検証し、未配線なら修正。
   - もし URL での `/quest` を強く望まれる場合は、別途 `pages/Quest.tsx` を作成し App.tsx に Route 追加します（要選択）。

---

## B. データベース構築（マイグレーション1本）

新規テーブル：

- `quest_bosses`（マスタ、stage_id 1〜8 にそれぞれボス1体）
- `user_quest_boss_progress`（user_id × stage_id の現在ボスHP、討伐状況）
- `quest_battle_logs`（戦闘ログ）
- `equipment_items`（マスタ：武器/盾/護符）
- `user_equipment`（所持・装備状態）

RLS：
- マスタ系は全認証ユーザー SELECT 可
- user系は本人 + トレーナー閲覧可、本人のみ書込み（ただし戦闘進行は SECURITY DEFINER RPC 経由）

初期データ：
- ボス8体（仕様書のHP/ATK/DEF）
- 装備12種（初期3種 + レイド3種 + クエスト報酬6種）

---

## C. RPC 関数

- `get_player_combat_stats(p_user_id)` — レベル+装備からHP/ATK/DEF算出
- `execute_quest_battle(p_user_id, p_session_volume)` — ダメージ計算、ボスHP減算、撃破時に報酬付与＆次ステージ進行
- `equip_item(p_user_id, p_item_id)` — 同枠の他装備を外して装備
- `initialize_quest_boss_progress()` — トレーナー用：初期装備配布 + ステージ1進捗レコード作成
- 既存 `complete_quest_stage` は呼出しを廃止（戦闘経由のみで進行）。関数は残置。

---

## D. トレーニング記録時のフック

`CustomerTraining.tsx` のセッション保存処理で：
1. セッション総挙上量を算出（既存の workouts.sets/weight×reps ロジック流用）
2. `execute_quest_battle` を呼出し
3. 結果を `QuestBattleResultDialog` に渡して表示

---

## E. UI 実装

### 既存修正
- `QuestCard.tsx` — ボス名・ボスHPバー・ATK表示に変更
- `CustomerQuest.tsx` — マップ表示をボスバトル方式に刷新（プレイヤーステータスパネル、各エリアのボス情報、装備ボタン）
- `TrainerQuestManager.tsx` — 初期化ボタンに装備配布追加、各会員にボス残HP・装備表示

### 新規
- `src/components/customer/EquipmentDialog.tsx` — 装備変更モーダル
- `src/components/customer/QuestBattleResultDialog.tsx` — バトル結果演出（フラッシュ、HPバーアニメ、撃破時の復興演出）
- `src/lib/questBosses.ts` — ボスアイコンマップ（Bot, Bug, Snowflake, Flame, Worm, Wand2, CloudLightning, Skull）
- `src/hooks/useQuestBattle.ts` — 戦闘ステータス取得フック

---

## F. 装備とレイド武器の連携

既存のレイド報酬（`equipped_weapon`/`equipped_background` on user_avatars）はそのまま残し、`equipment_items` に同期テーブルを新設。レイド完了時の武器付与に `user_equipment` への INSERT を追加（既存処理を壊さない）。

---

## 確認事項

実装ボリュームが非常に大きいため（約15ファイルの新規/修正、長尺マイグレーション1本、新RPC 4本）、以下を確認させてください：

1. **ルーティング**：QuestCard タップは「内部タブ切替（既存方式）」で OK か、それとも `/quest` URL ルートを新設するか
2. **既存の条件達成方式の扱い**：旧 `complete_quest_stage` ボタン（CustomerQuest 内「復興する！」）は完全に削除して良いか（ボス撃破でのみ進行するか）
3. **進行リセット**：既に旧方式でステージを進めた会員がいる場合、ボス進捗は「現ステージから満HPで開始」で良いか
4. **段階リリース**：1メッセージで全実装すると差分が膨大になり検証が困難です。**Phase1: バグ修正＋DB＋RPC＋フック**、**Phase2: UI演出（バトル結果ダイアログ・装備モーダル）** の2段階に分けても良いですか？
