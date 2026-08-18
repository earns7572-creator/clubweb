# Club Craft Web 0.6 — Type-Specific 3D Speaker Review Dossier

## 今回の変更

Club Craft WebのSpeakerは、CSSで立体に見せた平面パーツではなく、WebGL上で描く**実3D meshモデル**へ移行した。各Speaker Typeは色だけでなく、筐体比率・ドライバー数・前面構成・silhouetteが異なる。

| Type | 3Dシルエット | ドライバー構成 | 音のcharacter |
|---|---|---|---|
| SUB | 大きく低いcube cabinet | 大口径1基 | lowpass 110Hz |
| WOOFER | 横長cabinet | 2基の小型driver | lowpass 460Hz |
| FULL RANGE | 縦長2way tower | 上下2基のdriver | allpass |
| MID | 小型縦型cabinet | 中型1基 | bandpass 1600Hz |
| HIGH | 小さなhorn cabinet | 4角horn + throat | highpass 3600Hz |

## 3D Roomと操作

WebGLのClub Floorには、見下ろし3Dルーム、Stage、壁、12×12グリッド、実3D Speaker、自由に動くListenerがある。Speakerはグリッド交点へだけsnapし、Listenerは自由に移動できる。選択曲から選択Speakerへ、さらにListenerへ伸びるSignal Vermilion threadと、Listenerを中心とする距離リングが、空間上の関係を常時示す。

```text
選択曲 → 選択Speaker → Listener
       Type filter / level / mute / Panner
```

## 実装構成

| ファイル | 役割 |
|---|---|
| `client/src/components/ClubFloor3D.tsx` | React Three FiberによるWebGL Room、Type別mesh、距離リング、Signal thread、drag操作 |
| `client/src/pages/Home.tsx` | 曲、Speaker、Listener、Inspector、グリッドsnap状態 |
| `client/src/hooks/useClubAudio.ts` | filter、gain、mute、Panner、source管理 |
| `client/src/club-floor-3d.css` | Canvasの枠、mobileの正方形Floor |
| `client/src/three-polish.css` | 周囲の操作面を物理音響機器らしく見せるスタイル |

Three.js / React Three Fiber / Dreiを使うため、production JavaScript bundleは約1.6MB（gzip約445KB）になった。3Dモデルは外部GLBをダウンロードせず、アプリ内のlow-poly meshとして作るため、モデルごとのネットワーク待ちはない。

## 検証

| 項目 | 状態 |
|---|---|
| TypeScript | `pnpm check`成功 |
| Production build | `pnpm build`成功 |
| Desktop | Type別形状、Stage、壁、距離リング、Signal threadを確認 |
| Mobile | Canvasを正方形へ固定し、3D RoomとType別形状が読めることを確認 |
| 音声 | Type filter、level、mute、Panner、Speaker grid snap、Listener自由移動を既存Web Audio経路へ統合 |

## ChatGPTに評価してほしいこと

1. Typeごとの形の違いが、SUB / WOOFER / FULL RANGE / MID / HIGHとして瞬時に理解できるか。
2. 実3D Speaker導入が、初心者向け一画面Playgroundの操作性を損なっていないか。
3. グリッド固定Speakerと自由Listener、距離リング、Signal threadの組合せが空間の理解を助けるか。
4. WebGLとWeb Audioの組合せに、リリースを止める性能・操作・保守上のBlockerがあるか。
5. 次フェーズで精度を上げるべき対象が、3Dモデルの細部、Scene保存、実音源、tutorialのどれか。
