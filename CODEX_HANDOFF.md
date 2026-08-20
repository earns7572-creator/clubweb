# Club Craft Web — Codex引き継ぎ書

**更新日:** 2026-08-20（JST）  
**引き継ぎ基準commit:** `9cd752d` — `Add mobile motion look controls`  
**作業branch:** `main`  
**GitHub:** <https://github.com/earns7572-creator/clubweb>  
**公開URL:** <https://clubcraft-wvxzcj7u.manus.space>

> この文書は、Codexが既存実装を壊さずに次の変更を行うための技術的な正本です。新規機能に着手する前に、必ず「作業開始時の確認」と「不変条件」を確認してください。

## 1. プロダクトの目的

Club Craft Webは、専門的なPAシミュレータではなく、一般ユーザーが音源を再生し、仮想SpeakerとListenerを動かして、空間的な音の変化を直感的に体験するブラウザアプリです。操作の核は、**曲を選ぶ／再生する／Speakerを置く／SpeakerとListenerを動かす／音の変化を聴く**ことです。

画面は単一のClub Sceneを中心に構成します。TOPはレイアウト編集、SIDEは高さの読解、POVは没入的なヘッドホン体験です。Web版は物理出力や業務用Routing Matrixを目的にしません。

| 項目 | 現在の方針 |
|---|---|
| 想定利用者 | PA専門家ではない音楽リスナー・制作者 |
| 音源 | Club Craft内蔵の15秒20 Hz→20 kHz sweep、および端末ローカル音声ファイル |
| local file | サーバーへ送信しない。ブラウザ内のObject URLで扱う |
| Speaker上限 | 最大16台 |
| 表示 | TOP / SIDE / POVが同一のSpeaker・Listener stateを共有 |
| 主な見た目 | off-white / warm gray / graphite、建築模型、3Dプリント的なSpeaker模型 |

## 2. 作業開始時の確認

次の手順で、既存状態を確認してから変更してください。

```bash
git switch main
git pull github main
pnpm install
pnpm check
pnpm test:placement
pnpm test:performance
pnpm test:mixer
pnpm test:response
pnpm test:bass
pnpm test:stack
pnpm test:models
pnpm test:motion
pnpm build
```

開発サーバーは以下です。

```bash
pnpm dev
```

| コマンド | 検証対象 |
|---|---|
| `pnpm check` | TypeScript全体 |
| `pnpm test:placement` | Soft Grid・Smart Guide |
| `pnpm test:performance` | WebGL / RAF / AudioNodes / motionの静的制約 |
| `pnpm test:mixer` | Level・dB変換 |
| `pnpm test:response` | EQ / response curveのpure計算 |
| `pnpm test:bass` | 25–90 Hz中心のPOV bass pressure |
| `pnpm test:stack` | Speaker stackingのtree・高さ・candidate |
| `pnpm test:models` | Speaker model registry・preset・response共有 |
| `pnpm test:motion` | screen orientation補正を含むdevice quaternion |
| `pnpm build` | production build |

## 3. 技術構成

| レイヤー | 技術・責務 |
|---|---|
| UI | React 19 / TypeScript / Vite / Tailwind 4 |
| 3D | Three.js / `@react-three/fiber` / `@react-three/drei` |
| 音響 | Web Audio API / HRTF `PannerNode` / Web Audio BiquadFilter |
| 状態 | `Home.tsx`がSpeaker・Listener・source・viewの中心stateを保持 |
| activity | React stateではなく`activityStore`のexternal store。無音時の描画を止める |
| CSS | `spatial-installation.css`、`three-views.css`、`dark-club.css`、`mobile.css` |

### 3.1 主なファイル

| ファイル | 役割 |
|---|---|
| `client/src/pages/Home.tsx` | アプリstate、音源、Speaker追加・削除・移動、view切替、Inspector、MIX/CUSTOMを接続 |
| `client/src/hooks/useClubAudio.ts` | Audio graph、source playback、Speaker DSP、HRTF、Listener orientation同期 |
| `client/src/components/ClubFloor3D.tsx` | TOPのR3F scene、drag、grid、Smart Guide、stacking、Listener名編集 |
| `client/src/components/SideScene.tsx` | SIDEのDOM/CSS elevation view |
| `client/src/components/PovPreview.tsx` | POV camera、pointer look、bass vibration、device motion UI |
| `client/src/hooks/useDeviceLook.ts` | permission-gatedのdevice orientation処理、baseline、smoothing、HRTF更新throttle |
| `client/src/lib/deviceOrientation.ts` | screen orientation補正済みquaternion変換 |
| `client/src/lib/bassPressure.ts` | low-band energyからのcamera-only bass pressure |
| `client/src/lib/spatialCoordinates.ts` | stack-aware scene/audio座標変換 |
| `client/src/lib/speakerStacking.ts` | physical stack tree / effective position / height |
| `client/src/lib/speakerModels.ts` | Modern / Reggaeのmodel定義とcharacter filters |
| `client/src/components/SpeakerMiniature.tsx` | Modern speaker geometry dispatcher |
| `client/src/components/speakers/ReggaeSpeakerModel.tsx` | Reggae Sound System geometry |
| `client/src/components/DjBooth.tsx` | DJ boothと軽量DJ figure |
| `client/src/components/SimpleHumanAvatar.tsx` | Listener / DJ共通の低poly人型 |
| `client/src/mobile.css` | touch-first mobile shell、safe area、portrait / landscape、MOTION controls |

## 4. Audio graphと不変条件

Speaker 1台は、**1個のmono acoustic point source**として扱います。

```text
stereo source
  → explicit mono downmix (0.5 × L + 0.5 × R)
  → model character filter chain
  → per-speaker 4-band Custom EQ
  → Speaker level gain
  → AnalyserNode
  → HRTF PannerNode
  → stereo master / compressor
```

以下は、明示的な依頼なしに変更してはいけません。

| 不変条件 | 理由 |
|---|---|
| Panner前のmono downmix | 仮想Speakerを物理的な一点音源として扱うため |
| Pannerのstereo output | HRTFによる空間表現を維持するため |
| HRTF distance model・filter Q/frequency・master compressor | 既存の音響挙動を守るため |
| local audioをサーバーへ送らない | プライバシー要件 |
| Speaker modelのcharacter filterをruntimeとCUSTOM graphで共有 | 見た目のcurveと実音の不一致を防ぐため |
| camera vibrationはcameraのみ | Listener座標・HRTF・DOM UIを揺らさないため |

## 5. Speaker・stacking・speaker family

### 5.1 Speaker family

| Family | Model |
|---|---|
| Modern PA | SUB / WOOFER / FULL RANGE / MID / HIGH |
| Reggae Sound System | Scoop / Kick / Mid Horn / Top |

Speakerの実モデルは`modelId`で決まります。legacy stateへは`defaultModelForKind()`でfallbackします。新しいmodelを追加する場合は、`speakerModels.ts`、geometry、寸法、response curve、testsを同時に更新してください。

### 5.2 Physical stacking

`ClubSpeaker.stackParentId`により、1列は親→子の単一chainです。stack中の子は、親から導かれるeffective XYと高さを使います。TOPだけでなくSIDE、POV、HRTF audio position、bass distanceは必ずstack-resolved座標を使ってください。

> `speakerToAudioPosition(speaker, speakers)`を使わずに、素の`position`だけをaudio距離計算へ渡してはいけません。

## 6. POV bass vibration

POVの振動は音響パラメータではなく、視覚的なcamera effectです。

| 項目 | 現在値 |
|---|---|
| 主バンド | 25–90 Hz |
| 補助バンド | 90–160 Hz、重み`0.18` |
| >160 Hz | 振動なし |
| kind重み | SUB `1`、WOOFER `.5`、FULL `.08`、MID / HIGH `0` |
| gate | `.035` |
| pressure threshold | `.12` |
| analyser smoothing | `.35` |
| POV camera damping | attack `15`、release `11` |
| zero snap | `.004` |

Pause後は0.2–0.5秒程度で静止することを目標にしています。無音時はresidual RAFが継続しない構造です。

## 7. Listener・DJ・selection

Listenerは名前付きの簡易人型です。`ClubListener.name`は`localStorage`の`club-craft-listener-name`へ保存され、TOPの頭上ラベルをクリックして編集します。名前はaudio graphに影響してはいけません。

DJ boothは3 viewへ配置済みです。POVではListener自身を表示せず、正面のDJ boothとDJ figureだけを見せます。DJ poseは再生状態に応じた静的なgeometry切替であり、専用RAFやskeleton animationを追加してはいけません。

Speakerは起動時に未選択です。TOPの空きFloorクリックで選択解除できます。Inspector、Remove、selection ringは選択時のみ表示します。

## 8. Mobile UXとPhone Motion Look

### 8.1 mobile layout

`mobile.css`は760px以下のportraitを主対象にしています。sceneを主役にし、Speaker libraryはbottom dock、view switcherは親指位置、Inspectorはbottom sheet風のfloating panelです。`env(safe-area-inset-*)`を保ち、notch / home indicatorを考慮してください。

TOPのorthographic cameraはmobileでzoomを小さくし、DPRは最大1.15です。desktopを含め、Canvasの最大DPRは1.25を超えないでください。

### 8.2 device motion

MOTIONは**既定OFF**です。MOTION buttonのuser gestureからだけpermissionを要求します。

| 要件 | 実装 |
|---|---|
| iOS系 | `DeviceOrientationEvent.requestPermission(false)`をgesture内で呼ぶ |
| Android系 | permission APIがなければ対応イベントを許可扱いにする |
| 変換 | raw alpha/beta/gammaではなく、screen orientation補正済みquaternion |
| baseline | ON直後の端末poseを基準にする。アプリ起動時の固定値を使わない |
| dead zone相当 | yaw/pitchをそれぞれ±135° / ±0.95 radに制限 |
| smoothing | `.16`の低域追従 |
| HRTF更新 | `onLookAbsolute`を最大25Hzで送る |
| visual更新 | 最大30Hzで`invalidate()` |
| RECENTER | 現在poseをbaselineとする |
| OFF / unmount | event listenerを必ずremoveする |

MOTION中のswipe / dragは無効にせず、sensor baselineの中心を調整します。Speaker / Listenerの配置drag、TOP / SIDEのpointer処理を変更しないでください。

### 8.3 実機で要確認

sandboxではOSのpermission dialogと実ジャイロを検証できません。次の手順は、iOS SafariとAndroid Chromeの実機で確認してください。

1. HTTPSの公開URLを開き、POVへ切り替える。
2. `MOTION OFF`を1回タップし、permission dialogが出た場合は許可する。
3. 端末をゆっくり左右・上下へ動かし、camera lookと音像が同じ向きに変わることを確認する。
4. `RECENTER`後に現在方向が正面になることを確認する。
5. `MOTION ON`からOFFへ戻し、swipe / dragのみでlookできることを確認する。
6. 拒否・未対応端末では、エラーで停止せず`Motion access unavailable`が表示されることを確認する。

## 9. Performance rules

| 禁止または制限 | 理由 |
|---|---|
| PointLight / SpotLight / shadows / EffectComposer / UnrealBloomPass | GPU負荷と見た目の過剰化を避ける |
| per-render geometry生成 | R3FのGCとframe dropを避ける |
| 新しい常時RAF | idle GPUを休ませるため |
| `useFrame`でReact state更新 | render loopを増幅しないため |
| POV vibrationでListener positionを更新 | HRTFと視覚を混同しないため |
| device orientation eventごとの無制限state更新 | mobile CPUとaudio threadに負荷をかけないため |

TOPとPOV Canvasは`frameloop="demand"`です。activityが止まれば描画も止まる設計を維持してください。

## 10. 現在の既知事項と次の優先候補

実装上の既知のブロッカーはありません。ただし、端末姿勢permissionと実センサー入力は実機未確認です。Codexが次に着手する場合、まず実機確認を行い、その結果を`todo.md`へ記録するのが安全です。

優先候補は以下です。

1. iPhone / Android実機でMOTION permission・RECENTER・landscape safe areaを確認する。
2. mobile Inspectorを明確なdrag handle付きbottom sheetへ強化する。
3. mobile POVのDJ boothへ、再生時のみ非常に控えめなdeck / mixer activity indicatorを追加する。
4. Speaker選択解除をSIDE viewの空き領域クリックと`Escape`にも統一する。

## 11. 変更時の最低チェックリスト

| 変更対象 | 必須確認 |
|---|---|
| Audio / Speaker DSP | mono point source、HRTF、CUSTOM response、level、tests |
| Stack | TOP、SIDE、POV、audio position、bass distance |
| POV | vibration、MOTION OFF、swipe、RECENTER、reduced motion |
| UI | TOP / SIDE / POV、desktop / portrait / landscape、safe area |
| Performance | `test:performance`、idle RAF、DPR、不要なallocation |
| リリース前 | 全test、`pnpm build`、GitHub mainへpush |

## 12. Git / release

GitHub remoteは`github`です。通常の開発完了時は以下を行ってください。

```bash
git add <changed-files>
git commit -m "<concise change>"
git push github main
```

Manus側の公開チェックポイントは別に保存されます。GitHubのcommitだけでは、Manus公開版が必ずしも更新されるとは限りません。Manus上で作業する場合は、検証後にcheckpointも保存してください。

---

**引き継ぎ終了。** 変更する際は、常に「この変更はSpeakerを置いた瞬間に音の変化を楽しめるという体験を強めるか」を確認してください。
