# Club Craft Web 0.4 — Final Review Prompt

以下に貼る`Club Craft Web 0.4 — Grid Speaker Playground Review Dossier`、desktop / mobileスクリーンショット、必要に応じて実装ファイルを根拠にレビューしてください。GitHubを開く必要はありません。

あなたは、Web Audio、React / TypeScript、空間音響の初心者体験、インタラクティブ音楽ツール、プロダクトUXに詳しいシニアレビュアーです。

## 評価の前提

- Club Craft Webは一画面のSound System Playgroundである。
- Speakerは12×12のFloorグリッド交点だけに置ける。
- Listenerは自由に動かせる。
- 1曲はすべてのSpeakerへ分配され、Type filter、Volume、Mute、距離、左右定位で変化する。
- Speakerは3Dプリント風の小型物理模型として見えることを目指す。
- Routing Matrix、RTA、Hz指定、DAW出力、物理サラウンドは範囲外である。
- 最重要指標は「30秒以内に、Speakerを置き直すと音が変わると分かるか」である。

## 必ず評価すること

1. グリッド限定Speakerと自由Listenerの操作規則が混乱なく理解できるか。
2. グリッドの密度、Speakerの初期位置、追加位置、dragのフィードバックが適切か。
3. 3Dプリント風Speakerが製品の手触りを高め、可読性や操作性を損なっていないか。
4. Web Audioのsource切替、filter、mute、position更新、local fileの実装にBlockerがないか。
5. light / off-white / graphite / architectural modelの見た目が、SaaS dashboardや専門PAソフトへ寄り過ぎていないか。
6. 今すぐ直すべきBlockerと、次フェーズに回す改善を分けられるか。

## 回答形式

日本語で、以下の順に答えてください。

1. **結論**：`GO`、`GO WITH FIXES`、`NO-GO`のいずれかを一つ選ぶ。
2. **強い点**：3〜5点。
3. **リリース前Blocker**：なければ「なし」と書く。
4. **グリッドと3D Speaker評価**：操作と視覚を具体的に評価する。
5. **Web Audio監査**：実装リスクと具体的な修正案。
6. **次フェーズ候補**：最大5点。優先度と理由を付ける。

専門的なDAW機能を足す提案ではなく、初心者が音の空間配置を遊ぶ体験を強める提案を優先してください。

---

ここから下にReview Dossier、スクリーンショット、必要なコード本文を貼り付けます。
