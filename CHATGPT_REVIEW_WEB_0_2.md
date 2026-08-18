# Club Craft Web 0.2 — ChatGPT Review Dossier

## 評価対象

Club Craft Webは、DAWプラグインの代替ではない。音を選び、仮想Speakerを置き、Listener位置を動かして、ブラウザとヘッドホンだけで「自分のクラブ空間」を遊ぶためのライトな空間プレイグラウンドである。

この資料は、**GitHubを開かずにChatGPTへ渡すこと**を前提にしている。実装まで確認する必要がある場合だけ、以下のファイル本文をこの資料の後ろへ貼り付ければよい。

| 実装ファイル | 役割 |
|---|---|
| `client/src/pages/Home.tsx` | 画面、SOURCE、Speaker、Listener、Routing、Top / Side切替の状態管理 |
| `client/src/hooks/useClubAudio.ts` | Web AudioのSource、Filter、Gain、Panner、master output |
| `client/src/index.css` | 暗い実機コンソール、立体部屋、LED、モバイルレイアウト |
| `ideas.md` | ブランドとモックアップ参照の設計方針 |
| `todo.md` | 残作業 |

## 役割の境界

| 項目 | Club Craft Web 0.2 | VST3 / AU版 |
|---|---|---|
| 主目的 | 初心者でも空間を組み、ヘッドホンで遊ぶ | 制作、ミックス、現場での精密運用 |
| 実行環境 | ブラウザ | Ableton Live等のDAW |
| 出力 | ステレオ / ヘッドホン向けの空間感 | DAW・オーディオI/O・現場出力 |
| UI | 3D Club View、音源とSpeakerを触る | 厳密なRoute・DSP・セッション管理 |
| 非目標 | 物理5.1 / 7.1、RTA、精密EQ、YouTube抽出 | Web版のプレイグラウンド体験 |

> Web版の中心操作は、**音を選ぶ → Speakerを置く → 自分の位置を動かす**、の3つである。

## Web 0.2の現在機能

| 領域 | 実装内容 |
|---|---|
| SOURCE rack | `Deep Pulse`、`Rain Room`、`Bronze Air`を選択できる。自分の`audio/*`ファイルを追加でき、サーバーへ自動アップロードしない。 |
| Top / Side Club View | `TOP`は部屋を見下ろす主画面、`SIDE`はCSS遠近法で高さ感を示す軽量な視覚切替。WebGLではない。 |
| SOURCE objects | 選択・追加済みSourceを部屋内の小さな発光オブジェクトとして表示する。選択SourceのRouteだけ赤いSignal threadとして表示する。 |
| Speaker cabinets | SUB、WOOFER、FULL RANGE、MID、HIGHを下部Speaker trayから追加できる。Speakerはドラッグ、選択、削除できる。 |
| Listener | `◎ YOU`をドラッグできる。 |
| System Balance | SUB、FULL RANGE、HIGHのgroup levelを横sliderで簡潔に操作できる。プロ向けの多数メーターは表示しない。 |
| Selected Speaker | Speaker level、現在選択中Sourceからの`ROUTED / ROUTE HERE`、削除を操作できる。 |
| Scene | `INTIMATE`、`WIDE`、`FRONT HEAVY`で既定Speaker配置を変え、`RESET`で初期Sceneへ戻す。 |
| 再生 | `HEAR THE ROOM`が初回ユーザー操作でAudioContextを開始・停止する。 |

## Web Audioの設計

```text
Official oscillator / local HTMLAudioElement
                ↓
           Source Voice Gain
                ↓  (RouteがONのSpeakerへだけ接続)
Speaker filter → Speaker level → HRTF Panner
                ↓
        Master gain → Compressor → stereo / headphones
```

| Speaker | 軽いCharacter処理 |
|---|---|
| SUB | lowpass 110Hz |
| WOOFER | lowpass 460Hz |
| FULL RANGE | allpass |
| MID | bandpass 1600Hz |
| HIGH | highpass 3600Hz |

この処理は、厳密な音響シミュレーションではない。初学者がSpeakerの役割と配置差を感じるための、意図的に軽い空間表現である。

## 視覚方針

視覚は2種類のユーザー提供参照を統合している。実機写真からは、黒い機材面、小さな拡散LED、ガラスと金属の反射、物理的な密度を受け取る。ChatGPTモックアップからは、SOURCE rack、立体的な部屋、Speaker cabinet、Top / Side、Speaker tray、System Balanceの構造を受け取る。

| 規則 | 表現 |
|---|---|
| 暗い機材面 | 黒・緑灰・炭の背景、細いハイライト、内側の影、グリッドで構成する。 |
| 赤LED | `#ff5b52`。再生、選択、Route、Listener、Signal thread。 |
| 黄LED | `#ffd05d`。注意、準備、MID Speaker。 |
| 緑LED | `#4bffc1`。READY、HIGH Speaker、正常状態。 |
| 立体部屋 | CSSの壁面、遠近、cabinetの側面、grille、落ち影で表現する。 |
| 操作の簡潔さ | System Balanceは3 groupだけ、RTA・物理出力・複雑なDAW routingは出さない。 |

## プライバシーと権利

| 項目 | 方針 |
|---|---|
| 自分の音源 | `URL.createObjectURL`で現在のブラウザセッション内だけ再生する。自動upload・公開・共有はしない。 |
| 公式音源 | 現在はブラウザ生成のデモVoice。将来は開発者が権利を持つループや提供音源へ置き換える。 |
| 外部サイト音源 | YouTube / BandcampのURLから音声を抽出・取得・処理しない。 |
| Scene共有 | 未実装。次フェーズで音源なしのSceneデータだけを共有できるようにする候補。 |

## 検証済み事項と既知の制限

| 項目 | 状態 |
|---|---|
| TypeScript | `pnpm check`成功。 |
| Production build | `pnpm build`成功。Viteの初期bundleが500KBを超える警告は残る。 |
| Desktop | 1440×1000でSOURCE rack、3D Club View、Speaker tray、System Balanceを確認。 |
| Mobile | 390×844でSOURCE一覧、Club View、Speaker tray、System Balanceを縦積みで確認。 |
| 音声 | AudioContext、local file、Route、Panner、resume / suspendはコード実装済み。実際のヘッドホン・ブラウザ差異は実機確認が必要。 |
| Side view | 視覚的な遠近表示。Speaker高さや独立したSide座標を編集する機能ではない。 |
| System Balance | SUB / FULL RANGE / HIGHだけの簡略group level。全Speaker種別のミキサーではない。 |

## ChatGPTに評価してほしいこと

1. 初めての人が3操作以内に、音と位置の関係を理解できる導線になっているか。
2. SOURCE rack、Club View、System Balance、Speaker trayの役割が重複せず、専門知識なしでも理解できるか。
3. Web AudioのAudioContext開始、Route変更、local file、cleanupに重大な実装リスクがないか。
4. Top / Side切替が現在の軽量な実装範囲として正直で、誤解を生まないか。
5. 実機写真のLED質感とモックアップのコンソール構造を取り入れつつ、サイバーパンクやDAWの複雑さに寄り過ぎていないか。
6. 今すぐ直すべきBlockerと、0.3へ回すべき改善を分けられるか。

## 参照用スクリーンショットの渡し方

視覚評価を依頼する場合は、デスクトップ版とモバイル版のスクリーンショットをこの資料と一緒にChatGPTへ貼る。コード監査を依頼する場合は、上記3実装ファイルの本文も続けて貼る。
