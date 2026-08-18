# Club Craft Web 0.1 — ChatGPT Review Dossier

## 1. 評価してほしいもの

これは、Club CraftをDAWプラグインとは別に展開する、ブラウザ内で完結する**ヘッドホン向け空間リスニング・プレイグラウンド**です。ユーザーは音を選び、仮想Speakerを床へ配置し、Listenerを動かしながら「空間が変わる」感覚を遊べます。

レビュー時はGitHubを開く必要はありません。この資料と、必要に応じて以下の実装ファイル本文だけを読んで評価してください。

| ファイル | 役割 |
|---|---|
| `client/src/pages/Home.tsx` | 画面・状態・Speaker / Listener操作・Routing操作 |
| `client/src/hooks/useClubAudio.ts` | Web Audioの音声生成・空間化・音源管理 |
| `client/src/index.css` | 暗い実機パネルと拡散LEDの視覚体系 |
| `ideas.md` | ブランド方針・光・カラー・Sceneデータモデル |
| `todo.md` | 未完了の作業と確認事項 |

## 2. 製品の役割

| 項目 | Club Craft Web 0.1 | VST3 / AU版 |
|---|---|---|
| 主目的 | 誰でも音と空間で遊ぶ | 制作・ミックス・現場運用 |
| 実行場所 | ブラウザだけ | Ableton LiveなどのDAW |
| 出力 | ステレオ / ヘッドホン向けの空間感 | DAW・オーディオI/O・実際の現場 |
| 想定利用者 | 音楽好き、アーティスト、初学者 | 制作者、DJ、エンジニア |
| 専門性 | 低い。3操作から始める | 高い。制作に必要な精密操作を扱う |

> Web版の核は「音を置く。空間が変わる。」である。物理5.1 / 7.1出力、DAW連携、精密EQ、RTAは扱わない。

## 3. Web 0.1で実装済みの機能

| 機能 | 現在の動作 |
|---|---|
| 公式Sound library | `Deep Pulse`、`Rain Room`、`Bronze Air`を選べる。初期版はブラウザ生成の持続音を使い、ライセンス済み楽曲を必須にしない。 |
| MY SOUNDS | ユーザーが`audio/*`ファイルを選ぶと、Object URLで現在のブラウザセッションに追加する。サーバーへ自動送信しない。 |
| Speaker | SUB / WOOFER / FULL RANGE / MID / HIGHを追加・削除・選択・ドラッグできる。種別とlevelをInspectorから変更できる。 |
| Listener | `◎ YOU`をFloor View上でドラッグできる。 |
| Routing | 選択中のSoundと選択中のSpeakerを`ROUTED` / `ARM ROUTE`で接続・解除できる。接続は赤いSignal threadで可視化される。 |
| Mood | `INTIMATE`、`WIDE`、`FRONT HEAVY`で既定Speakerの配置を変える。 |
| 再生 | `HEAR THE ROOM`がAudioContextを初回ユーザー操作で開始・停止する。 |
| 操作説明 | `HOW IT WORKS`から3操作の簡単な説明を開ける。 |

## 4. Web Audioの実装方針

`useClubAudio.ts`がAudioContextを一つ持ち、SourceごとにVoiceを作り、Route先のSpeaker Nodeへ接続します。Speaker Nodeは種別ごとの`BiquadFilterNode`、levelの`GainNode`、ヘッドホン向けの`PannerNode`で構成します。全Speaker Nodeはmaster gainとcompressorを経て、ブラウザの標準AudioDestinationへ送られます。

```text
Official oscillator / local HTMLAudioElement
                ↓
           Source Voice Gain
                ↓  (RouteがONのSpeakerだけへ接続)
 Speaker filter → Speaker level → HRTF Panner
                ↓
        Master gain → Compressor → Headphones / stereo output
```

| Speaker種別 | 現在のCharacter処理 |
|---|---|
| SUB | lowpass 110Hz |
| WOOFER | lowpass 460Hz |
| FULL RANGE | allpass |
| MID | bandpass 1600Hz |
| HIGH | highpass 3600Hz |

これは音響制作ツールの厳密なスピーカーシミュレーションではなく、初心者がSpeakerの役割の違いを空間的に感じるための意図的に軽いCharacter処理です。

## 5. デザイン規則

ユーザー提供の実機写真を参照し、明るい紙面の平面図ではなく、**黒に近い機材面の上で小さなLEDが拡散して光る**体験へ更新しています。

| 規則 | 実装上の表現 |
|---|---|
| 暗い機材面 | 黒・グレー・わずかな緑灰でFloor、Shelf、Inspectorを構成する。 |
| 物理的な密度 | グリッド、同心線、計測線、原点マーク、内側の影、細いハイライトを使う。 |
| 赤LED | `#ff5b52`。再生中、選択、Route、Listener、Signal threadを表す。 |
| 黄LED | `#ffd05d`。Route準備中、MID Speaker、注意を表す。 |
| 緑LED | `#4bffc1`。READY、HIGH Speaker、正常状態を表す。 |
| 白い光 | FULL RANGE Speakerと読みやすさが必要な機材ラベルに限定する。 |
| UIの比喩 | 音を選ぶ、Speakerを置く、Listenerの位置に立つ。複雑な表形式を最初に出さない。 |

Floor Viewは単なるキャンバスではなく、**建築平面図と暗いパッチベイの中間**として扱います。

## 6. プライバシーと権利の境界

| 事項 | 0.1の扱い |
|---|---|
| ユーザーのローカル音源 | `URL.createObjectURL`で現在のセッション内だけ再生する。アップロード・公開・共有は行わない。 |
| 公式音源 | 現状はWeb Audioで生成するデモVoice。将来、開発者が権利を持つループ・アーティスト提供音源へ差し替える。 |
| YouTube / Bandcamp | URLからの音声取得、抽出、処理は実装しない。 |
| Scene保存 | 未実装。次フェーズで状態だけの共有リンクを検討できる。 |

## 7. 検証済みの事項

| 検証 | 結果 |
|---|---|
| TypeScript | `pnpm check`成功 |
| Production build | `pnpm build`成功 |
| デスクトップ画面 | 1440×1000でFloor、Shelf、Inspector、LED状態表示を確認 |
| モバイル画面 | 390×844で縦積みレイアウト、Floor、Inspectorが読めることを確認 |
| Web Audio | コード上でAudioContext、AudioNode接続、local audio要素、resume / suspendを実装。実際のデバイス音量・ブラウザ差異の最終確認は手元のヘッドホン環境で必要。 |

ビルド時にViteの初期bundleが500KBを超えるという最適化警告が出ますが、ビルドは成功しています。0.1の機能上のブロッカーではないものの、次段階でコード分割を検討できます。

## 8. 意図的に未実装のこと

| 非目標 | 理由 |
|---|---|
| 物理マルチチャンネル出力 | Web版はヘッドホン体験を中心にするため。 |
| 本格バイノーラル / HRTF最適化 | 0.1は`PannerNode`による軽い空間感に留めるため。 |
| アカウント・クラウド保存 | 初期体験を軽くし、ローカル音源の扱いを明快にするため。 |
| 他サイト音源の取り込み | 権利・CORS・安定性の問題を避けるため。 |
| 本格的なDAW Routing / EQ | VST3 / AU版の責務であるため。 |

## 9. ChatGPTへ評価してほしい問い

1. 初めてのユーザーは、3操作以内に音が変化する体験へ到達できるか。
2. Web Audioの接続・再接続・local fileの扱いに重大な不具合や漏れがないか。
3. Speaker種別と色の関係は、信号機カラーの意味を混乱なく伝えているか。
4. 暗い機材面と拡散LEDのビジュアルは、ユーザー写真の「実機の質感」を参照しつつ、操作性を損ねていないか。
5. Web 0.1のスコープに対して、今すぐ直すべき問題と次フェーズへ回すべき問題を分けられているか。
6. VST3 / AU版とWeb版の役割分担は、製品として一貫しているか。

## 10. 評価に必要な追加情報

ChatGPTが実装コードまで検査したい場合は、この資料に加えて、上の表に挙げた4ファイルを貼り付けてください。見た目を評価したい場合は、デスクトップとモバイルのスクリーンショットも一緒に送ってください。
