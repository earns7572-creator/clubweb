# SYSTM release UI rebuild — 目視レビュー待ち

この版は実装と静的・計算テストを終えたレビュー版です。画面の目視・反復調整を完了するまで、リリース完了とは扱いません。

| 項目 | 状態 |
|---|---|
| BRANCH | `feat/astra-release-ui-rebuild` |
| BASE SHA | `6897356e7c6d1ea40ef86034923c5f07a50d7823` |
| 基準の選定 | GitHubをfetchし、指定の`c8111b5`より新しいFULL前面比率修正を確認して採用 |
| main | 変更・mergeなし |
| 対象HEAD | この文書を含むコミット。push後の値は会話で報告 |

## デザインと実装

机上の小さなサウンドシステムを、余白と部品索引で囲む構成。中央の3D体験のために、従来のヘッダー／全面トレイ／右側プロパティパネルという外装を解体しました。

| 部位 | 新しい構成 |
|---|---|
| Desktop | Sceneを全画面に敷き、左下に幅146pxの部品索引。操作を画面の縁へ分散 |
| Mobile | 縦画面を維持。Sceneは固定したまま、下端からトレイと選択操作を開く |
| Header | SYSTMの文字、SOUND、PLAY／STOPのみ |
| View selector | 下中央のTOP／SIDE／POV。選択状態を細い下線で表示 |
| Component tray | SUB／WOOFER／FULL／MID／HIGH＋SUPPORT／BLOCK。カード・擬似機材画像なし |
| Inspector | 選択された実際の投影ラベルを参照して近くに配置。色・適用範囲・回転・削除・DETACHを優先 |
| 詳細操作 | MODEL／LEVEL／MUTE／EQをADJUST内へ。MIX・SURFACE・LAYOUTは画面下の小さな文字操作へ |
| 初期の塗装 | 初期SUBをCHALK RED、FULLをPOWDER BLUEに設定。形状・座標・音響値は維持 |
| CSS | index／systm／mobileを置換。古いfloor-instrument／spatial-installation／dark-clubを削除。SIDEの既存オブジェクト描画と二次操作のCSSを分離 |

## 保護対象の確認

`BASE SHA`とのバイト比較で、次のファイル群に変更がないことを確認しました。

- `client/src/hooks/`、`client/src/lib/`の全内容
- `ClubFloor3D.tsx`、`SideScene.tsx`、`PovPreview.tsx`、`SpeakerMiniature.tsx`
- `SoundFieldLayer.tsx`、`components/speakers/`、`client/public/models/`
- `package.json`、`pnpm-lock.yaml`

`Home.tsx`内のSceneProjection本体、Sceneへ渡すprops、配置・回転・積み重ね・BLOCK連携・DETACH・色適用の処理も基準と一致しています。

| 項目 | 検証状態 |
|---|---|
| ENGINE REGRESSION | 物理・配置・回転・stack・BLOCKの計算テスト合格。ブラウザ内の操作回帰は未確認 |
| AUDIO | エンジン無変更。gain staging／MIX／band／response／bassの計算テスト合格。実音の聴取は未実施 |
| CATALOG | 追加・MODEL変更・RECIPESの公開選択肢をCLUBに限定。旧モデルの保存データ読込は維持 |
| SPEAKER MODELS | 承認済みモデルとmodern-fullの実装は無変更 |
| COLOR PALETTE | `#D9A09A`／`#A9C7D8`／`#BDD79A`／`#B9B1D8`／`#8C9096`を維持。CUSTOM／THIS／STACK／ALLを維持 |
| SOUND PICKER | ファイル入力・検証・Object URL・ソース選択処理を維持。Sceneと操作の重なり順を分離。不正ファイル表示も追加。実機での選択は未確認 |

## テスト結果

以下21項目はすべて合格しました。

`check`、`build:pages`、`test:mobile`、`test:placement`、`test:physical-placement`、`test:interaction`、`test:orientation`、`test:stack`、`test:block-support`、`test:layout`、`test:product-ux`、`test:visual-polish`、`test:performance`、`test:models`、`test:mixer`、`test:gain-staging`、`test:band`、`test:response`、`test:bass`、`test:recipe`、`test:recipe-ux`。

環境の`pnpm`ラッパーはv11系で、プロジェクト指定v10.4.1と不整合があり、overrides／modules再インストールで失敗しました。依存定義やlockfileは変更せず、インストールは`corepack pnpm install --frozen-lockfile`、実行は同等の直接コマンドを使用しました。

```sh
node node_modules/typescript/bin/tsc --noEmit
node node_modules/vite/bin/vite.js build
node --import tsx tests/mobilePov.test.ts
# 他のtsxテストも node --import tsx tests/<test>.ts
# 既存のnodeテストはpackage.json記載の node tests/<runner> のまま
```

`tsx` CLIはこの環境のIPCソケット制限で失敗するため、同じtsxをNodeのimportフックとして使用しています。production buildは成功し、3Dを含む既存の大きなJSチャンクに関するVite警告が残ります。

旧DOM／トレイのtransformを前提にした静的テストは、新しい公開カタログとoverlay構成に合わせて更新しました。performanceテストには、基準モデルですでに導入されたrecessed wooferの式と合わない古いassertがあり、モデル側を変更せずassertを合わせました。これらの静的テストはスクリーンショット検証を代替しません。

## 目視QAと残作業

Cloud BrowserのURLポリシーがローカルプレビューを拒否したため、ブラウザでの画面確認は実施できていません。別経路で同じ制限を回避する操作はしていません。GitHubに接続された既存Cloudflare Pagesが作る、このブランチのレビュー用URLからユーザーが共有するスクリーンショットを見て調整を続けます。

| 対象 | 目視・操作QA |
|---|---|
| Desktop（通常／選択／SOUND／TOP・SIDE・POV） | 未実施 |
| 320×568 | 未実施 |
| 375×667 | 未実施 |
| 390×844 | 未実施 |
| 393×852 | 未実施 |
| 430×932 | 未実施 |

残る確認：Sceneの主役性、操作票の実位置、横はみ出し、トレイ／操作票／SOUNDの重なり、開閉前後のScene寸法、ドラッグ・回転・積み重ね・DETACH・Listener・再生・ローカルファイル選択。受け取った画面をもとに視覚修正し、必要なテストを再実行します。
