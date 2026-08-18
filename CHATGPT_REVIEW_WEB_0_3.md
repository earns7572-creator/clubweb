# Club Craft Web 0.3 — Sound System Playground Review Dossier

## 評価対象

Club Craft Web 0.3は、DAWやPAコンソールの再現ではない。一般ユーザーが好きな曲を選び、仮想Speakerを自由に置き、Listenerを動かし、**Speakerの位置・種類・距離で音が変わることを遊ぶ**1画面のWeb音楽ツールである。

この資料はGitHubを開かずにChatGPTへ渡せる自己完結資料である。コードを詳しく確認する場合だけ、下の3ファイルの本文をこの後ろに貼り付ける。

| ファイル | 役割 |
|---|---|
| `client/src/pages/Home.tsx` | 1画面UI、曲選択、Speaker追加・drag、Listener drag、Inspector |
| `client/src/hooks/useClubAudio.ts` | Web Audioの曲・Speaker filter・level・mute・Panner |
| `client/src/index.css` | light / off-white / graphite / physical instrumentの視覚体系 |

## 体験のゴール

> 初めての人が30秒以内に、**曲を選ぶ → Speakerを足す → PLAYを押す → SpeakerまたはYOUを動かす → 音が変わる**へ到達することが最優先である。

| ユーザー操作 | 画面上の場所 | 期待する変化 |
|---|---|---|
| 曲を選ぶ / 追加する | 左の`Sounds for your room` | 選択曲が全Speakerへ送られる |
| PLAYを押す | 右上 | AudioContextを開始し、曲が再生される |
| Speakerを追加する | Floor下の`ADD A SPEAKER` | 新しいTypeの仮想Speakerが中央に置かれる |
| Speakerをドラッグする | 中央のFloor | 左右定位とListenerからの距離が変わる |
| `◎ YOU`をドラッグする | 中央のFloor | 同じく定位と距離感が変わる |
| Speakerを選択する | 中央のFloor | 右のInspectorでType、Volume、Mute、Removeだけを触れる |

## 意図的に採用しないもの

| 非目標 | 理由 |
|---|---|
| Routing Matrix / Band Routing | 一曲を複数Speakerへ自然に分配する体験を最初に検証するため |
| RTA / Hz入力 / 精密Output設定 | 音響知識を前提にせず、置く・動かす操作へ集中するため |
| Tab中心の画面遷移 | 重要な操作を1画面内で完結させるため |
| 物理5.1 / 7.1 / 現場出力 | Web版はヘッドホンで遊ぶ入口、現場用途はVST3 / AU版の責務であるため |
| YouTube / Bandcampからの音声取得 | 権利・CORS・安定性の問題を避けるため |

## 現在の機能

| 領域 | 実装 |
|---|---|
| Sound library | `Deep Pulse`、`Rain Room`、`Bronze Air`をClub Craft側のデモ音源として選択できる |
| MY SONG | `audio/*`を選ぶと、Object URLで現在のブラウザセッション内だけ再生する。自動uploadはしない |
| Speaker Type | SUB、WOOFER、FULL RANGE、MID、HIGHを追加できる |
| Speaker state | 各Speakerは`type`、`level`、`muted`、`x/y`を内部に持つ。X/Y数値はUIで見せない |
| Inspector | Type、Volume、Mute、Removeだけを表示する |
| Panning / distance | SpeakerとListenerの相対位置をWeb Audio `PannerNode`へ送り、HRTF、stereo pan、inverse distance attenuationを使う |
| Reset | 初期Speaker配置とListener位置へ戻す |

## Web Audioの実装方針

選択中の1曲だけをVoiceとして生成する。Voiceは**すべてのSpeaker**へ接続され、Speaker Typeのfilter、level、mute、位置情報によって、ヘッドホンでの聞こえ方が変わる。これはStemを分解する処理ではなく、1曲を仮想Sound Systemへ通す体験である。

```text
Official oscillator または local HTMLAudioElement
                     ↓
                 Source Voice
                     ↓ （全Speakerへ分配）
Type filter → level / mute → HRTF Panner
                     ↓
             master gain → compressor → stereo headphones
```

| Speaker Type | Character filter |
|---|---|
| SUB | lowpass 110Hz |
| WOOFER | lowpass 460Hz |
| FULL RANGE | allpass |
| MID | bandpass 1600Hz |
| HIGH | highpass 3600Hz |

## 視覚方針

見た目はlight / off-white / graphiteの建築模型と物理楽器を基調にする。中央のFloorを最重要領域にし、薄いグリッド、立体的な部屋の輪郭、物理Speaker cabinet、控えめな赤・黄・緑の状態光で構成する。これはSaaS dashboardや専門的PAソフトではなく、**机の上に置かれた小さなSound System模型**のように見えることを狙う。

| 色と素材 | 役割 |
|---|---|
| off-white / warm gray | 部屋、床、余白、読みやすさ |
| graphite | Speaker grille、境界、操作面 |
| red | PLAY、Listener、選択中の曲、注意を引く操作 |
| yellow / green | Speaker Typeの小さな識別点 |
| 物理的な影 | SpeakerをFloor上の物体として感じさせる |

## 検証済み事項と制限

| 項目 | 状態 |
|---|---|
| TypeScript | `pnpm check`成功 |
| Production build | `pnpm build`成功。初期bundle 500KB超の警告は残るがビルド成功 |
| Desktop | 1440×1000で1画面Playgroundの構成を確認 |
| Mobile | 390×844で曲選択 → Floor → Speaker追加 → Inspectorの順に表示されることを確認 |
| 音声 | AudioContext、選択曲のVoice、filter、gain / mute、Panner、local file、resume / suspendをコード実装済み |
| 実機音声 | ブラウザとヘッドホンによる実音確認は、ユーザーの端末で最終確認が必要 |

## ChatGPTに評価してほしいこと

1. 30秒以内に「Speakerを置くと音が変わる」を理解できる導線か。
2. 1曲を全Speakerへ分配してfilter / spatial placementで遊ぶ方式は、初期Web体験として妥当か。
3. Speaker Type、Volume、Mute、RemoveだけのInspectorは初心者に十分か。
4. Web AudioのVoice切替、local file、mute、Panner、cleanupに重大な問題がないか。
5. light / off-white / graphite / physical instrumentの視覚が、専門コンソールやSaaS dashboardへ寄り過ぎていないか。
6. リリース前に直すBlockerと、次フェーズ（Scene保存、共有、実音源など）へ回す改善を分けられるか。

## スクリーンショットとコードの渡し方

視覚評価では、desktopとmobileのスクリーンショットをこの資料と一緒に渡す。コード監査が必要なら、最初の表にある3ファイルの本文をこの資料の後ろに貼る。
