# Club Craft Web 0.6 — Final Review Prompt

以下に貼る`Club Craft Web 0.6 — Type-Specific 3D Speaker Review Dossier`、desktop / mobileスクリーンショット、必要ならコード本文を根拠にレビューしてください。GitHubを開く必要はありません。

あなたは、WebGL / Three.js、Web Audio、空間音響の初心者UX、インタラクティブ音楽プロダクトに詳しいシニアレビュアーです。

## 前提

- Web版はDAWではなく、一画面のSound System Playgroundである。
- Speakerは実3D meshで、Typeごとに形・比率・ドライバー構成が異なる。
- Speakerは12×12のFloor gridへsnapし、Listenerは自由に動く。
- 選択曲は全Speakerへ流れ、Type filter、level、mute、距離、左右定位が反映される。
- Signal Vermilion threadとListener距離リングが配置関係を示す。
- 専門Routing UI、RTA、物理出力は範囲外である。

## 回答形式

1. **結論**：`GO`、`GO WITH FIXES`、`NO-GO`のどれか。
2. **強い点**：3〜5点。
3. **リリース前Blocker**：なければ「なし」。
4. **Type別3Dモデル評価**：形・認識性・物理感・初学者UXを評価する。
5. **WebGL / Web Audio監査**：性能・操作・実装リスクと具体的な修正案。
6. **次の優先順位**：最大5項目。理由付きで示す。

DAWやPAコンソールの機能を増やす提案ではなく、「Speakerを置いたら音が変わる」体験を強める提案を優先してください。
