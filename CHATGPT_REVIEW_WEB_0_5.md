# Club Craft Web 0.5 — Architectural Club Room Review Dossier

## この版の目的

Club Craft Web 0.5は、専門コンソールを模倣するのではなく、**見下ろしの立体Club RoomにSpeakerを配置して聴く一画面のSound System Playground**である。参照したプロ向けモックアップからは、壁・奥行き・Stage・Speaker cabinetの配置感だけを採用し、固定Stem、RTA、System Balance、物理出力は採用しない。

## 一画面でできること

| 操作 | 結果 |
|---|---|
| 曲を選ぶ / 自分の音源を追加する | 選択曲が仮想Speaker全体へ送られる。ローカル音源は現在の端末内だけで扱う。 |
| PLAY | Web Audioの再生を開始する。 |
| Speakerを下部トレイから追加する | SUB、WOOFER、FULL RANGE、MID、HIGHのいずれかを有効グリッドへ追加する。 |
| Speakerをdragする | Speakerは12×12のFloorグリッド交点へだけ配置される。 |
| `◎ YOU`をdragする | Listenerは自由に動き、Speakerとの相対位置で聞こえ方が変わる。 |
| Speakerを選ぶ | Type、Volume、Mute、Removeだけを操作できる。 |

## Roomの表現

Floorの中心には、CSSで表現した見下ろし3Dルームがある。奥の壁、左右の壁、Stage plinth、Stageの小さな3連Speaker、遠近を持つ12×12 gridを描き、平面図ではなく**音を置く部屋**に見せる。Speaker cabinetは3Dプリント風のマット樹脂、積層痕、grille、底面リブ、影を持つCSSモデルである。

| 視覚要素 | 意味 |
|---|---|
| 奥壁・側壁・Stage | Club Roomの奥行きと音の出発点 |
| 12×12 Floor grid | Speakerを組むための配置規則 |
| Speaker cabinet | Typeごとに音色と造形カラーを持つ物理模型 |
| Listener `◎ YOU` | 今、どこで聴いているか |
| Signal Vermilion thread | 選択曲から選択Speakerへ音が送られていること |

## Web Audio

選択中の1曲は全Speakerへ分配され、Speaker Typeのfilter、level、mute、位置が各経路の音を作る。SpeakerとListenerの相対位置は`PannerNode`へ渡され、headphones / stereo出力で左右定位と距離減衰を作る。

| Type | Character |
|---|---|
| SUB | lowpass 110Hz |
| WOOFER | lowpass 460Hz |
| FULL RANGE | allpass |
| MID | bandpass 1600Hz |
| HIGH | highpass 3600Hz |

## 意図的な範囲外

Routing Matrix、Band Routing、RTA、Hz指定、固定Stemのチャンネルストリップ、DAW連携、物理5.1 / 7.1出力、外部サイトの音声取得は入れない。Web版で最初に検証するのは、**Speakerを一つ置き直した瞬間に面白いか**である。

## 検証状況

| 項目 | 状態 |
|---|---|
| TypeScript | `pnpm check`成功 |
| Production build | `pnpm build`成功。初期bundle 500KB超の警告のみ残る。 |
| Desktop | 見下ろし3Dルーム、Stage、壁、grid、Speaker、Signal thread、Inspectorを確認。 |
| Mobile | 曲選択 → Room → Speaker tray → Inspectorの順で操作できることを確認。 |
| 実音 | AudioContext、filter、gain / mute、Panner、local fileの経路を実装。音質印象の最終確認はユーザーのヘッドホンで必要。 |

## ChatGPTに評価してほしいこと

1. 見下ろし3D Roomが、Playgroundのシンプルさを損なわず空間に置く感覚を高めているか。
2. Speakerのグリッド固定とListenerの自由移動の役割分担が直感的か。
3. Stage・壁・Speaker cabinetの表現が、プロ用PAソフトではなく軽い音楽体験として読めるか。
4. Web Audioのfilter / mute / Panner構成に重大な問題がないか。
5. リリース前のBlockerと、次フェーズ（Scene保存、共有、実音源）へ回す改善を分けられるか。

## コード監査をする場合

`Home.tsx`、`useClubAudio.ts`、`index.css`、`playground-signals.css`、`speaker-printed.css`、`grid-snap.css`、`room-architecture.css`の本文をこの資料の後ろに貼る。
