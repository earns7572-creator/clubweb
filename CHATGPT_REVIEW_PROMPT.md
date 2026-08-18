# ChatGPTに渡すレビュー依頼文

以下をそのままChatGPTへ送ってください。

---

GitHubリポジトリ `https://github.com/earns7572-creator/clubweb` の最新 `main` を、最初から最後までコードレビューしてください。

最初にリポジトリ直下の `CHATGPT_REVIEW.md` を読んでください。そこに、このWebアプリの目的、機能範囲、意図的に対象外としている機能、アーキテクチャ、手動確認手順、優先度が書いてあります。

このアプリは、一般ユーザーが曲を再生して仮想SpeakerとListenerを配置し、ヘッドホンで空間的な音の変化を楽しむブラウザアプリです。業務用PAソフトやDAW pluginの再現ではありません。

特に次を厳密に確認してください。

1. `useClubAudio.ts` のWeb Audio graph、HRTF、ローカル音声ファイル再生、cleanupに二重接続・nodeリーク・再生切替の不整合がないか。
2. `Home.tsx`、`ClubFloor3D.tsx`、`SideScene.tsx`、`PovPreview.tsx` のTOP / SIDE / POVが、同じ`Position3D`を正しく共有しているか。
3. TOP Viewが最大16 Speakerの操作用画面として軽量か。特にshadow map、ContactShadows、castShadow、receiveShadowが使われていないか。
4. React Three Fiberで不正なJSX属性がThree.js objectへ渡る可能性、pointer drag、grid snap、geometry / material共有に問題がないか。
5. Speaker Typeの音色・activity色・3D silhouetteの対応が一貫しているか。SUBのdual folded-horn、WOOFERのvertical horn-loaded chamber、FULL RANGEのdeep horn＋recessed woofer、MIDのcompact horn＋driver、HIGHのhorn mouth→throat→rear bodyを、製品コピーをせずに読み分けられるか。
6. `SpeakerMiniature.tsx`でgeometry / materialがrenderごとに生成されず、最大16台でも同じresourceが共有されるか。
7. 一般ユーザーが「曲を選ぶ → Speakerを追加 → 動かして聴く」を短時間で理解できるUIか。

新機能のアイデアや全面的な作り直しは不要です。既存の仕様と設計範囲を守る最小限の改善だけを提案してください。

問題がある場合は、各項目を以下の形式で書いてください。

`優先度 / ファイル / 問題の流れ / なぜ問題か / 最小修正案 / 修正後の確認方法`

問題がなければ、確認した観点、根拠となるファイル、残るリスクを明示したうえでPASSとしてください。

---
