# Club Craft Web — ChatGPT Review Guide

## 目的

Club Craft Webは、端末内の音声ファイルまたはアプリ内の音源を再生しながら、仮想クラブ空間にSpeakerとListenerを配置して、ヘッドホン上の空間的な音の変化を体験するためのブラウザアプリです。業務用PAソフトの再現ではなく、一般の人が「Speakerを置くと音が変わる」と直感的に理解できる小さなVirtual Sound System instrumentを目指しています。

> レビューでは、新機能の追加提案よりも、既存の再生・配置・3視点・HRTF・操作性・描画負荷の整合性を優先してください。

## 現在の機能範囲

| 領域 | 実装済みの内容 | レビュー上の重要点 |
| --- | --- | --- |
| 音源 | アプリ内音源とブラウザ内のローカル音声ファイル | ファイルは外部へ送信せず、ブラウザ内で再生する |
| Speaker | SUB / WOOFER / FULL RANGE / MID / HIGH、最大16台 | 種別ごとに3D silhouetteとWeb Audio filterが異なる。すべてmodule-level shared geometry / materialを使う。 |
| 空間音響 | Type filter → Gain → Analyser → HRTF Panner → Master | SpeakerとListenerのPosition3Dが共有Sceneから同期される |
| View | TOP / SIDE / POV | 3視点は同一ClubSceneを別の投影で編集・確認する |
| TOP操作 | X/Yグリッドへのスナップ配置、Speaker / Listenerのドラッグ | 停止時も編集できる明るさを維持し、shadow mapは使わない |
| SIDE操作 | Y/Zの高さ編集 | TOPと同じPosition3Dを更新する |
| POV | Listener位置からの一人称確認、yaw / pitch | 見る向きもAudioListener orientationへ同期する |
| 表現 | 暗い地下クラブ、低密度haze、再生時の周波数色 | 停止時TOPは読みやすく、SIDE / POVは没入感を優先する |

## 色と音の対応

| Speaker Type | 周波数の役割 | 再生時のactivity色 |
| --- | --- | --- |
| SUB | 低域中心 | 深い赤 `#ef3e32` |
| WOOFER | 低中域中心 | 赤橙 `#f06a31` |
| FULL RANGE | 全帯域 | 暖かい黄 `#f2a842` |
| MID | 中域中心 | 黄 `#e7d64b` |
| HIGH | 高域中心 | 緑 `#56d46a` |

## 重要な設計判断

### 1. 1つのClubSceneが正本

SpeakerとListenerはともに`Position3D`を保持し、TOP / SIDE / POVは別々のレイアウトを持ちながらも、同一のSceneを読んで編集します。Viewを切り替えても、audio graphの作り直しや位置のリセットを行わない設計です。

### 2. 音響処理はSpeakerごとに独立

各Speakerは、音源から種別filter、level、activity測定用Analyser、HRTF Panner、masterへつながります。activity値は視覚表現専用であり、音響経路を壊さないことが必要です。

### 3. TOPは軽量な編集面

TOP Viewは操作性を優先します。停止時の可視性はambient / hemisphere / 非shadow directional lighting、Floor、Grid、Stage、Speaker edgeで確保します。**shadow map、ContactShadows、castShadow、receiveShadowはTOPで使いません。** 中央spotlightと薄いhazeは見た目の奥行きのために残していますが、影のモデリングには利用していません。

### 4. Speakerの形で種類を認識できる

色だけに依存せず、すべてThree.jsの手続き型sub-meshで組み立てます。SUBとWOOFERは全面baffleを置かず、mouthからflare、開いたthroat、短いtunnel wall、recessed throatへ続くdeep chamberを持ちます。FULL RANGEはupper deep hornとrecessed large wooferを持つtall 2-way PA、MIDはwide / low hornと大きめdriver、single horizontal portを持つ浅いcompact enclosure、HIGHはwide horn mouthからnarrow throat、short neck、円筒compression driver、rear magnet housingへつながる専用frameです。固有の製品名、logo、固有意匠は使いません。

## 主なコード案内

| ファイル | 担当 |
| --- | --- |
| `client/src/pages/Home.tsx` | 共有ClubScene、View切替、曲選択、Speaker追加、Inspector |
| `client/src/hooks/useClubAudio.ts` | Web Audio graph、HRTF、ローカルファイル再生、activity値 |
| `client/src/components/ClubFloor3D.tsx` | TOP ViewのR3F Scene、グリッドスナップ、軽量lighting |
| `client/src/components/SideScene.tsx` | SIDE ViewのY/Z編集 |
| `client/src/components/PovPreview.tsx` | POVのCamera / yaw / pitchとListener orientation |
| `client/src/components/SpeakerMiniature.tsx` | 5種のmodule-level shared PA geometry、horn flare、woofer assembly、activity光、idle edge |
| `client/src/components/SpeakerModelValidation.tsx` | 3D Speaker形状を中立光で確認する検証用route。Typeとcamera angleをqueryで指定可能。 |
| `client/src/dark-club.css` | 暗いクラブの操作面と浮遊UI |
| `client/src/spatial-installation.css` | 画面全体の構成とFloor中心の配置 |
| `client/src/three-views.css` | TOP / SIDE / POVの切替と各Viewの表示規則 |

## ローカル確認手順

```bash
pnpm install
pnpm check
pnpm build
pnpm dev
```

ブラウザで表示後、次の順に手動確認してください。

1. `TOP`でSpeakerとListenerが停止中でも見えること、Speakerがグリッドにスナップすることを確認します。
2. Speakerを追加・選択・ドラッグ・削除し、Floating InspectorでType、Level、Mute、Heightを操作します。
3. 端末の音声ファイルを選び、Playを押します。ヘッドホンでSpeakerを左右・遠近に動かした際の変化を確認します。
4. `SIDE`でSpeakerのY/Zを動かし、TOPへ戻って共有Sceneが維持されることを確認します。
5. `POV`でListener位置と視線を変え、HRTF previewが維持されることを確認します。
6. `/?model-lab=1`で5種のSpeakerの形を確認します。`/?model-lab=1&active=1`ではactivity色も確認できます。
7. 単体確認は、たとえば`/?model-lab=1&kind=sub&angle=three-quarter`、`/?model-lab=1&kind=high&angle=three-quarter`、`/?model-lab=1&kind=full&angle=front`を使います。`kind`は`sub`、`woofer`、`full`、`mid`、`high`、`angle`は`front`、`three-quarter`、`side`です。

## レビューしてほしい観点

| 優先度 | 観点 | 確認してほしいこと |
| --- | --- | --- |
| 高 | audio graph | node接続、cleanup、再生切替、local file、HRTF更新にリークや二重接続がないか |
| 高 | 共有Scene | TOP / SIDE / POVでPosition3Dが一貫し、View切替で状態が失われないか |
| 高 | TOP操作性 | pointer drag、grid snap、停止時可視性、最大16台で不要な高負荷処理がないか |
| 高 | R3F安全性 | JSX属性がThree.js objectへ不正に渡らないか、horn / woofer / cabinet geometryとmaterialがmodule-levelで共有されるか |
| 中 | performance | TOPにshadow mapやContactShadowsが復活していないか、render中のgeometry allocationがなく、最大16台で各SpeakerのPointLightが1個だけか、hazeが共有geometryを使うか |
| 中 | UX | 一般利用者が30秒以内に「曲を選ぶ・Speakerを置く・動かして聴く」を理解できるか |
| 低 | visual | 暗いクラブの雰囲気を保ちつつ、TOPだけは配置編集に十分な明度を持つか |

## 意図的に対象外としている機能

Routing Matrix、Band Routing、RTA、物理的なマルチチャンネル出力、DAW pluginの専門UI、クラウドへの音声アップロード、YouTubeやBandcampなどの外部サイトからの音声取得は、このWeb版の対象外です。

## レビュー結果の書き方

不具合または懸念点がある場合は、次の順で記述してください。

1. **優先度**（Blocker / High / Medium / Low）
2. **対象ファイルと該当箇所**
3. **再現条件または問題の流れ**
4. **なぜ問題か**
5. **最小限の修正案**
6. **修正後に確認すべきテスト**

根拠のない大規模な作り直しや、今回の対象外機能を前提とした提案は避けてください。
