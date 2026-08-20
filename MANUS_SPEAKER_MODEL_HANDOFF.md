# Club Craft — Manus向け Speaker 3Dモデル制作引き継ぎ

この文書の目的は、ManusがClub Craftへ新しいSpeaker 3Dモデルを追加する際に、既存モデルと同じ**軽さ・見やすさ・音響連動・stacking互換性**を保つことです。

## 0. 最初に守ること

- `kind` は音響上の役割（`sub` / `woofer` / `full` / `mid` / `high`）であり、見た目の名称ではない。
- `modelId` がキャビネットの形、寸法、character filterを選ぶ。
- Speaker 1台はAudio graph上で常に**1個のmono acoustic point source**。3Dの見た目を増やしても音源を増やさない。
- `body.width` / `height` / `depth` はstacking、TOP、SIDE、POV、HRTF位置に影響する。見た目だけの都合で変更しない。
- 既存のaudio graph、HRTF、stacking、POV bass vibrationを変更しない。

## 1. 関連ファイル

| ファイル | 変更対象 |
|---|---|
| `client/src/lib/speakerModels.ts` | 新しい`modelId`、family、kind、表示名、物理寸法、character filters |
| `client/src/lib/speakerDimensions.ts` | kind共通の標準寸法を変える必要がある場合だけ |
| `client/src/components/SpeakerMiniature.tsx` | Modern PA系の軽量モデル |
| `client/src/components/speakers/ReggaeSpeakerModel.tsx` | Reggae Sound System系の軽量モデル |
| `client/src/lib/systemPresets.ts` | 新モデルをpresetへ入れる場合 |
| `tests/speakerModels.test.ts` | registryとpresetの検証 |
| `tests/performanceArchitecture.test.cjs` | 軽量設計の不変条件 |

## 2. 現在のデザイン言語

### Modern PA

- 明るいグレースケールのキャビネット。外装、バッフル、ホーン壁、リムで明度差を作る。
- `FULL RANGE` は「上部の矩形ホーン + 下部の大口径ウーファー」。
- `HIGH` / `MID` はコンプレッションドライバーにつながる矩形ホーン。
- `SUB` / `WOOFER` は折り返しホーン、開口、縦横のブレースを読むことができる。

### Reggae Sound System

- Modernと同じグレースケール。木目、ブランド名、錆、写真テクスチャは使わない。
- Scoopは大型箱、上部の暗いbay、下部の深いhorn mouth、内側の縦横ブレースで構成する。
- Kick / Mid Horn / Topも、円形LEDの列ではなく、矩形horn mouthとthroatを使う。

## 3. 軽量モデルの必須ルール

1. module scopeで共有する`BoxGeometry`、Cylinder、Torus、BufferGeometryを再利用する。
2. 同じ種類のモデルごとに新しいGeometryを毎renderで生成しない。
3. cabinet、frame、horn wall、emitterは共有Materialを使う。
4. `PointLight`、`SpotLight`、shadow、postprocessing、per-speaker RAFを追加しない。
5. 1つのhornは、**台形4面のBufferGeometry + throat + 1〜2本のrim**で表す。
6. 形状を細かくするより、silhouette、口径、rim、braces、明度差を優先する。
7. セグメント数はWoofer 24〜32程度、丸い金具は12〜16程度までに留める。

### Hornの構造

```text
mouth rim（明るめのグレー）
  → 四面の台形flare（面ごとに少し違うグレー）
  → 中間rim
  → 小さいthroat（active時だけ周波数色で発光）
```

Hornはキャビネット前面に大きく浮かせない。薄い深さだけを確保し、斜めから見た時に台形の4面が読めればよい。

## 4. 色と発光

### 非アクティブ時

| 部位 | 目安 |
|---|---|
| cabinet | 中明度グレー（例 `#686e73`〜`#70767b`） |
| baffle | cabinetより暗いグレー |
| horn walls | 4面で暗〜中明度のグレー差 |
| frame / braces | cabinetより少し明るいグレー |
| throat / recess | ほぼ黒だが完全な黒つぶれを避ける |
| woofer cone | ダークグレー |

### active時

- キャビネット、フレーム、ブレース、外装は発光させない。
- 発光してよいのは、horn throat、woofer coneの内側だけ。
- Low=`#ff3b30`、Mid=`#ffd60a`、High=`#32d05b`の帯域色を既存の`setFrequencyColor()` / emitter Materialに従って使う。
- glowは控えめにし、発光でディテールを消さない。

## 5. 新モデル追加の手順

1. 参照画像から「役割」「正面silhouette」「開口の形」「ウーファー数」「ブレース」を5項目以内で言語化する。
2. 既存の`kind`へ割り当てる。新しい音響roleが必要でない限り`SpeakerKind`を増やさない。
3. `speakerModels.ts`へ`modelId`を追加する。body寸法は実物らしい比率にするが、既存stackingと干渉しない値にする。
4. ModernまたはReggaeの対応モデルコンポーネントを作る。共通Geometry / Materialを再利用する。
5. front、3/4、sideで口・奥行き・braces・ウーファーが読めることを確認する。
6. `speakerModels.test.ts`、`performanceArchitecture.test.cjs`、`pnpm check`、`pnpm build`を通す。

## 6. Manusへの作業指示テンプレート

以下をそのまま渡し、`[ ]`だけ埋めてください。

```text
Club Craft Webに新しいSpeaker 3Dモデル「[モデル名]」を追加してください。

参照の特徴:
- acoustic role: [sub / woofer / full / mid / high]
- family: [modern / reggae]
- 正面silhouette: [例: 横長の矩形hornを2基]
- 主要部品: [例: 15インチwoofer 1基、矩形horn 1基、縦ブレース2本]
- 避ける要素: 写真テクスチャ、ロゴ、複雑なねじ、過剰な丸いLED

必須:
1. `modelId`は見た目・body寸法・character filterを選ぶだけにし、1台のSpeakerを複数のAudioNodeやPannerに分けない。
2. `SpeakerMiniature.tsx`または`ReggaeSpeakerModel.tsx`の共有Geometry / Materialを再利用する。
3. PointLight、SpotLight、shadow、postprocessing、per-speaker RAFを追加しない。
4. 明るいグレースケールにする。cabinet / baffle / horn wall / frame / recessが非再生時でも読み分けられるよう、明度差を作る。
5. 発光はhorn throatとwoofer coneだけ。外装は発光させない。
6. Hornは台形4面、mouth rim、中間rim、小さいthroatで表す。キャビネット前面から大きく浮かせない。
7. TOP / SIDE / POV、stacking、HRTF位置、既存audio graphを壊さない。
8. `pnpm check`、`pnpm test:models`、`pnpm test:performance`、`pnpm build`を実行して結果を報告する。

変更前に既存の`MANUS_SPEAKER_MODEL_HANDOFF.md`、`CODEX_HANDOFF.md`、speakerModels、既存のModern / Reggaeモデルを読んでください。
```

## 7. 完了チェックリスト

- [ ] front / 3/4 / sideで何のSpeakerか分かる
- [ ] 非再生時でも黒つぶれせず、開口・リム・ブレースが分かる
- [ ] active時の色はthroat / coneだけに出る
- [ ] 共有Geometry / Materialを使っている
- [ ] 新しいライト、shadow、postprocessing、RAFを追加していない
- [ ] `modelId`、body、character filters、UIラベル、testsが一致している
- [ ] TOP / SIDE / POVとstackingの寸法整合性を確認した
- [ ] `pnpm check`、`pnpm test:models`、`pnpm test:performance`、`pnpm build`が通った
