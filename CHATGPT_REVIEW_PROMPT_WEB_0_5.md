# Club Craft Web 0.5 — Final Review Prompt

以下に貼る`Club Craft Web 0.5 — Architectural Club Room Review Dossier`、desktop / mobileスクリーンショット、必要なら実装コードを根拠にレビューしてください。GitHubを開く必要はありません。

あなたは、Web Audio、React / TypeScript、空間音響の初心者UX、インタラクティブ音楽プロダクトに詳しいシニアレビュアーです。

## 前提

- これはDAW / PAコンソールではなく、一画面のSound System Playgroundである。
- 見下ろし3Dルーム、Stage、壁、12×12のSpeaker grid、自由移動するListenerを使う。
- 1曲は全Speakerへ送られ、filter、level、mute、Pannerで変化する。
- RTA、Routing Matrix、固定Stem、複雑なOutputは意図的にない。
- 30秒以内に「Speakerを置き直すと音が変わる」と分かることが最重要である。

## 回答形式

日本語で、次の順に答えてください。

1. **結論**：`GO`、`GO WITH FIXES`、`NO-GO`のどれか。
2. **強い点**：3〜5点。
3. **リリース前Blocker**：なければ「なし」。
4. **3D Room / grid / Speaker評価**：空間性と操作性の両面を具体的に評価する。
5. **Web Audio監査**：filter、mute、Panner、local file、cleanupの実装リスクと修正案。
6. **初心者30秒導線評価**：どこで迷うか、何がすぐ伝わるか。
7. **次に作る順番**：最大5項目、理由と優先度を付ける。

専門UIを増やす提案ではなく、音を置く楽しさを強める提案を優先してください。
