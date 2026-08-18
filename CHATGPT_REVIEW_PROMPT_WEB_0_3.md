# Club Craft Web 0.3 — Final Review Prompt

以下に貼る`Club Craft Web 0.3 — Sound System Playground Review Dossier`、スクリーンショット、必要であれば実装ファイルを根拠にレビューしてください。GitHubを開く必要はありません。ここで渡す情報だけで評価してください。

あなたは、Web Audio、React / TypeScript、インタラクティブ音楽体験、初心者向けUX、音楽プロダクト設計に詳しいシニアレビュアーです。

## 前提

- これはDAW PluginやPAコンソールの再現ではない。
- 一画面のSound System Playgroundである。
- ユーザーが曲を選び、Speakerを置き、Listenerを動かして、ヘッドホンで音の変化を遊ぶ。
- 選択曲はすべての仮想Speakerへ分配され、Type別filter、level、mute、位置により聞こえ方が変化する。
- Routing Matrix、RTA、Hz指定、Band Routing、物理マルチチャンネル、外部サイト音源取得は意図的に範囲外である。
- 初心者が30秒以内に「置くと音が変わる」と理解できることが最重要である。

## 必ず評価する項目

| 領域 | 観点 |
|---|---|
| 30秒導線 | 曲選択、PLAY、Speaker追加、drag、音の変化へ迷わず到達できるか |
| 体験の核 | Speaker 1個を置いた瞬間に面白いと思える設計か |
| 音声 | filter、mute、gain、Panner、distance、local file、Voice切替の実装リスク |
| UI | Inspectorが必要最小限か。専門UIへ逆戻りしていないか |
| 視覚 | off-white / graphite / physical instrumentが適切で、SaaS dashboardでないか |
| 製品境界 | VST版との責務を混ぜず、Web版の入口体験へ集中できているか |

## 回答形式

日本語で、次の順に答えてください。

1. **結論**：`GO`、`GO WITH FIXES`、`NO-GO`のいずれかを一つ選ぶ。
2. **強い点**：3〜5点。
3. **リリース前Blocker**：なければ「なし」と書く。
4. **優先度の高い改善**：次フェーズへ回すものを最大5点、理由付きで示す。
5. **Web Audio監査**：重大なリスクと、具体的な修正案。
6. **初心者UX監査**：30秒導線と「置くと音が変わる」体験を評価する。
7. **次の実装順**：価値が高い順に3〜6項目。

問題がある場合は、何が・どの場面で・なぜ初学者の体験を壊すかを具体的に書いてください。範囲外のDAW機能を追加して体験を複雑にしないでください。

---

ここから下に、`CHATGPT_REVIEW_WEB_0_3.md`の本文とdesktop / mobileスクリーンショットを貼ります。コード監査も必要なら、`Home.tsx`、`useClubAudio.ts`、`index.css`を続けて貼ります。
