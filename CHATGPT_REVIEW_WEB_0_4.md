# Club Craft Web 0.4 — Grid Speaker Playground Review Dossier

## 評価対象

Club Craft Web 0.4は、一般ユーザーが曲を選び、**グリッドの交点にだけ置ける仮想Speaker**と、自由に移動できるListenerを使って、ヘッドホンで音の位置・距離・Speaker Typeの変化を遊ぶ一画面Web音楽ツールである。

これはDAWやPAコンソールの再現ではない。目標は、Speakerを一つ置き直した瞬間に「音が変わった」と理解できるSound System Playgroundである。

## 現在の操作

| 操作 | 挙動 |
|---|---|
| 曲を選ぶ / 追加する | Club Craftのデモ音源か、ユーザーの`audio/*`ファイルを選べる。ローカル音源は自動uploadしない。 |
| PLAY | 選択曲をすべての仮想Speakerへ流す。 |
| Speakerを追加する | SUB、WOOFER、FULL RANGE、MID、HIGHをFloor中央付近の有効グリッド交点へ追加する。 |
| Speakerをドラッグする | 12×12のFloorグリッド交点へ必ずスナップする。中間座標には置けない。 |
| Listener `◎ YOU` | 自由にdragできる。Speakerとは異なり、グリッド固定ではない。 |
| Speakerを選択する | Type、Volume、Mute、RemoveだけをInspectorで操作できる。 |

## SpeakerモデルとFloor

Speakerは画像ではなくCSSで描かれた物理オブジェクトである。matte resin、細い積層痕、正面grille、底面のリブ、側面、床への影により、**3Dプリンターから出力した小型Speaker模型**の質感を表現する。

Floorの背景は、表示上も12×12のグリッドとなる。ドラッグ後のSpeaker座標と見えるグリッド交点を一致させることで、自由配置ではなく「配置を組む」体験を作る。

| Speaker Type | Web Audio Character | 造形カラー |
|---|---|---|
| SUB | lowpass 110Hz | graphite resin |
| WOOFER | lowpass 460Hz | warm gray resin |
| FULL RANGE | allpass | off-white resin |
| MID | bandpass 1600Hz | muted yellow resin |
| HIGH | highpass 3600Hz | muted green resin |

## 音声処理

```text
選択曲（デモVoice または local HTMLAudioElement）
                     ↓
               全Speakerへ分配
                     ↓
Type filter → level / mute → HRTF Panner
                     ↓
         master gain → compressor → headphones / stereo
```

SpeakerとListenerの相対位置を`PannerNode`へ送る。SpeakerがListenerの左 / 右に置かれると左右の聞こえ方が変わり、近づくと強く、遠ざけると弱くなる。全Speakerの座標はWeb Audio処理へ即時反映される。

## 視覚と導線

- off-white、graphite、薄い影、物理的なSpeakerを基調にする。
- 赤いSignal Vermilion threadは、選択曲から選択Speakerへ常時表示し、音が空間に送られることを表現する。
- Floorは距離リング、Stage原点、N / Room Axis、縮尺を含む建築的なオーディオ地図である。
- Routing Matrix、RTA、Hz指定、Tab中心の専門UI、物理マルチチャンネル出力は表示しない。

## 検証済み事項

| 項目 | 状態 |
|---|---|
| TypeScript | `pnpm check`成功 |
| Production build | `pnpm build`成功。初期bundle 500KB超の警告は残る。 |
| Desktop | グリッド、スナップ済み初期Speaker、3Dプリント風モデル、Signal threadを確認。 |
| Mobile | 曲選択、Floor、Speaker追加、Inspectorの順で操作できるレイアウトを確認。 |
| 実機音声 | AudioContext、filter、gain / mute、Panner、local fileはコード実装済み。最終的な音の印象はユーザーのヘッドホンで確認が必要。 |

## ChatGPTに評価してほしいこと

1. Speakerだけをグリッド固定し、Listenerを自由移動とする操作規則は直感的か。
2. 3Dプリント風Speakerが、画像なしでも物理的な模型として読めるか。
3. 12×12のsnap gridは初学者の配置体験にちょうどよい粒度か。
4. Speaker Typeのfilter、Volume、Mute、距離・左右定位の実装に重大なリスクがないか。
5. 30秒以内に「Speakerを置き直すと音が変わる」へ到達できるか。
6. 次に追加するべき機能と、意図的に加えない方がよい専門機能を分けられるか。

## コード監査をする場合

実装まで確認する場合だけ、次の本文をこの資料に続けて貼る。

| ファイル | 役割 |
|---|---|
| `client/src/pages/Home.tsx` | grid snap、drag、Speaker追加、UI状態 |
| `client/src/hooks/useClubAudio.ts` | filter、gain、mute、Panner、source管理 |
| `client/src/index.css` | Playgroundの全体レイアウト |
| `client/src/playground-signals.css` | Signal threadとFloor注記 |
| `client/src/speaker-printed.css` | 3Dプリント風Speakerモデル |
| `client/src/grid-snap.css` | 12×12 Floorグリッド |
