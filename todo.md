# Club Craft Web — Signal Color Update

- [x] グレー基調を保った信号機カラーの役割を定義する。
- [x] Floor View、Route、Speaker、音源カードへ赤・黄・緑の状態色を適用する。
- [x] Inspectorと再生状態のコントラストを調整する。
- [x] desktop / mobileの画面確認と本番ビルドを行う。
- [ ] 更新をチェックポイントとGitHubへ保存する。
- [x] 提供されたHEIC写真を元データを保ったまま閲覧可能な形式へ変換し、光と素材の参照を抽出する。
- [x] 暗い機材面、拡散LED、ガラス越しの光、物理操作面のデザイン規則を定義する。
- [x] Floor Viewと音源棚を暗い実機パネルの質感へ更新する。
- [x] Router、Speaker、音源カードへ物理的なLED状態フィードバックを実装する。
- [x] desktop / mobileの表示とWeb Audioの動作を検証して保存する。
- [x] ChatGPTへ貼り付けるための設計・実装・検証レビュー資料と評価プロンプトを作成する。
- [x] ChatGPTモックアップを再解釈したTop / Side Club ViewとSOURCEオブジェクトを実装する。
- [x] SOURCE一覧、Speaker追加トレイ、ライトなSystem Balanceを実装する。
- [x] 既存のWeb Audio、Routing、Listener操作を新しい3D Club UIへ統合する。
- [x] desktop / mobile確認とChatGPT評価資料更新を行う。
- [ ] モックアップ参照を反映した完成版を保存する。
- [x] 既存のFloor、Speaker drag、Listener drag、Web Audio再生をPlayground用に再利用する。
- [x] 1画面で「曲を選ぶ・Speakerを追加する・置く・聴く」が分かる導線へ整理する。
- [x] InspectorをType、Volume、Mute、Removeだけへ絞る。
- [x] Routing Matrix、RTA、専門的なSystem Balanceを表示から外す。
- [x] Speaker Type別のfilter、level、mute、距離・左右定位を一般ユーザー向け操作で検証する。
- [x] 30秒導線、desktop / mobile、ChatGPTレビュー資料を更新する。
- [ ] Sound System Playground完成版を保存する。
- [x] SpeakerだけがFloorの一定間隔のグリッド交点へスナップするよう変更する。
- [x] Speaker追加時も有効なグリッド交点へ配置する。
- [x] Speaker cabinetを積層痕・マット樹脂・物理エッジを持つ3Dプリント風モデルへ更新する。
- [x] desktop / mobileでグリッド配置とSpeakerの可読性を検証し、ChatGPT Web 0.4資料を更新する。
- [ ] グリッド・スナップと3Dプリント風Speakerを含む完成版を保存する。
- [x] 参照モックアップをライトなWeb Playgroundの見下ろし3Dルームへ再解釈する。
- [x] 奥行きのある壁、Stage、12×12 Floorグリッド、Speaker cabinet配置を実装する。
- [x] 曲選択、Speaker tray、Listener、Inspectorを新ルーム構成へ統合する。
- [x] グリッド・音色・定位・desktop / mobileを検証し、ChatGPT Web 0.5資料を更新する。
- [ ] 見下ろし3Dルームを含む完成版を保存する。
- [x] CSS疑似3D SpeakerをWebGLの実3Dメッシュモデルへ置き換える方式を定義する。
- [x] SUB、WOOFER、FULL RANGE、MID、HIGHに対応する低ポリゴンSpeakerモデルを準備する。
- [x] 3DモデルをFloorのグリッド、選択、Listener、Web Audio定位へ統合する。
- [x] 3D描画のdesktop / mobile性能と操作性を検証する。
- [x] SUB、WOOFER、FULL RANGE、MID、HIGHのTypeごとの筐体比率、形状、ドライバー構成を定義する。
- [x] 各Typeで異なる形状の低ポリゴン3D Speakerモデルを用意する。
- [x] Speaker Typeの変更と追加で正しい3DモデルがFloorへ表示されるようにする。
- [x] Type別3Dモデルの仕様とChatGPT Web 0.6資料を更新する。
- [x] 実3D Speakerモデルを含む完成版を保存する。
- [x] React Three Fiberのdata-loc属性クラッシュの注入経路を特定する。
- [x] 開発用属性が3D Canvas内部のThree.jsオブジェクトへ渡らないよう修正する。
- [x] 型検査、production build、表示確認で3D Floorの回復を検証する。
- [x] クラッシュ修正を保存して原因と結果を記録する。
- [x] Club Craftの固定Design Systemを、物理的な小型サウンドシステム／建築模型として文書化する。
- [x] Floor Viewを画面の主役にし、周囲の操作を最小限へ再配置する。
- [x] 音源選択、再生、Speaker配置、Listener、Inspectorの既存操作を保ったまま視覚を再設計する。
- [x] desktop / mobileで新しい1画面レイアウトと既存操作を検証する。
- [x] UI再設計をチェックポイントへ保存する。
- [x] 固定Sidebarをなくし、Floorが画面の85〜90%を占める単一作業面へ再構成する。
- [x] 上部の現在曲名から開く曲選択Popoverと端末音源追加を実装する。
- [x] 選択Speakerに寄り添う最小限のFloating Inspectorへ既存調整を移す。
- [x] orthographicなFloor、Speaker cabinet、Listener、条件付きSignal threadへ3D表現を更新する。
- [x] 既存の再生・配置・Listener操作を検証し、Floor中心UIを保存する。
- [x] SpeakerとListenerのPosition3D、初期Height、Scene-to-Audio座標変換を定義する。
- [x] Floating InspectorにFLOOR〜OVERHEADの直感的なHeight操作を追加する。
- [x] Top ViewでHeightを控えめに伝えるSpeakerの浮き・stem・shadow表現を追加する。
- [x] SpeakerごとのFilter→Gain→HRTF PannerNode経路と20〜50msの平滑な位置更新を実装する。
- [x] modern AudioParam APIとlegacy setterのfallbackでListenerとSpeakerの3D位置を同期する。
- [x] 最大16 Speaker、既存ドラッグ、Height、音色、HRTF Previewを検証して保存・報告する。
- [x] 既存のハードウェア風border、panel、legend、略称、選択リングを取り除く対象として整理する。
- [x] 静かな現代的空間オーディオ・インスタレーションのDesign Systemを定義する。
- [x] 連続するoff-white Canvasと精密な単色Speaker模型を主役に再構成する。
- [x] Inspector、曲選択、選択状態、タイポグラフィをborderlessで控えめな操作面にする。
- [x] 既存の再生・配置・Height・HRTF操作を維持してdesktop/mobileで検証し保存する。
- [x] ローカル音源の追加からAudioContext開始、Speaker接続、再生までの処理を確認する。
- [x] ローカル音源の再生同期とAudioContext resumeを修正する。
- [x] 非対応音声ファイルや再生失敗をユーザーが分かる形で表示する。
- [x] 型検査、production build、実行時ログでローカル音源経路を検証し保存する。
- [x] TOP・SIDE・POVの共通ClubSceneと、残りの受入基準を確認する。
- [x] 同一Position3Dを読む小さなTOP / SIDE / POV View Switcherを追加する。
- [x] SIDE ViewでY/Zだけを直接ドラッグ編集できる小さなSound System模型を実装する。
- [x] POVでListener位置・yaw・pitchを視覚とAudioListenerへ同期する。
- [x] View切替でもAudio Graphを作り直さず、既存HRTF・ローカル音源を保つ。
- [x] desktop/mobile、Top/Side/POV、音響同期を検証して保存・報告する。
- [x] 既存TOP・SIDE・POVの描画とSpeaker活動データの接続点を確認する。
- [x] 暗闇・haze・活動Speaker・控えめな暗色操作面のDesign Systemを定義する。
- [x] TOP・SIDE・POVで共有する黒いクラブ空間と低密度のvolumetric-looking hazeを実装する。
- [x] Speaker activityと再生状態に連動する控えめなcone illumination・rim lightを実装する。
- [x] 既存の再生、HRTF、配置、3視点、desktop/mobileを検証して保存する。
- [x] 現在のInspector、Speaker追加、選択Speaker、TOP停止時描画の接続を確認する。
- [x] ロゴと重ならないInspector、選択Speaker上のRemove、Type別追加アイコンの方針を定義する。
- [x] Inspector位置調整、選択Speaker右上のRemove、Type別ワンタップ追加を実装する。
- [x] 停止中TOPの環境光と3視点の操作面を検証して保存する。
- [x] Type別3Dモデル、activity解析、haze、残りの受入基準を確認する。
- [x] Type別PAモデル、activity character、haze illumination、暗所視認性の方針を定義する。
- [x] SUB / WOOFER / FULL / MID / HIGHの軽量な共有PAモデルを実装する。
- [x] 実音声activityのattack/releaseとType別driver・rim・haze反応を実装する。
- [x] TOP / SIDE / POV、最大16 Speaker、既存操作とproduction buildを検証して保存する。
- [x] 現在のSpeakerMiniature、Three.js geometry、既存モデルの限界を確認する。
- [x] SUB / WOOFER / FULL / MID / HIGHの専用PA sub-mesh構成と共有resource方針を定義する。
- [x] SpeakerMiniatureを専用geometry・bevel・recess・woofer・horn・feet構成へ置き換える。
- [x] 明るい検証Sceneで5種横並びとFULLのfront / 3/4 / sideを確認する。
- [x] 本番のTOP / SIDE / POV、型検査、production buildを検証して保存する。
- [x] TOPの停止時照明、Floor、Speaker silhouette、Listener、Stageの現在の可視性を確認する。
- [x] TOP専用のbase illuminationと、再生時activityがより明確に見える階層を実装する。
- [x] 停止中・再生時TOP、SIDE・POV不変、型検査、production buildを検証して保存する。
- [x] TOP停止時の可視性不足と現在のSpeaker activity光の接続を確認する。
- [x] TOP専用idle paletteと低域赤・中域黄・高域緑の帯域色・光量階層を定義する。
- [x] TOPのbase visibilityと帯域色activity illuminationを実装する。
- [x] 停止中TOP、再生時帯域色、SIDE/POV、型検査、production buildを検証して保存する。
- [x] 参照写真の縦長2-way PA構造と現在のFULLモデルを照合する。
- [x] ロゴ・固有形状を避けたオリジナルFULL cabinet、horn、woofer、grille、detail方針を定義する。
- [x] FULL RANGEだけを上部horn・下部大径woofer・protective grille・傾いた縦長cabinetの専用geometryへ置き換える。
- [x] 明るい検証Sceneと本番TOPでFULLのfront / 3/4 / side、型検査、buildを確認して保存する。
- [x] TOPの中心座標、現在の照明、haze、Floorへの光の受け方を確認する。
- [x] 中心上部から落ちるspotlightと控えめなvolumetric-looking coneを実装する。
- [x] TOP表示、既存Speaker activity、SIDE/POV不変、型検査、production buildを検証して保存する。
- [x] TOP全体のambient、Floor、Grid、cabinet edgeの現在の明度を確認する。
- [x] TOP専用にambient・Floor・Grid・cabinet edgeを明るく調整する。
- [x] 停止時TOP、再生時帯域色、SIDE/POV不変、型検査、production buildを検証して保存する。
- [x] TOP View内のshadow・haze・light処理から、操作性を損なう負荷要素を確認する。
- [x] 環境光由来のリアルタイム影を外し、軽量なbase visibilityへ置き換える。
- [x] TOPの操作性と可視性、既存audio・SIDE/POV不変、型検査、production buildを検証して保存する。
- [x] ローカルGit状態、指定GitHubリポジトリ、branch、既存履歴を確認する。
- [x] ChatGPTレビュー用の実装概要・確認手順・論点を追加する。
- [x] 既存履歴を保ちながらcommitし、指定GitHubリポジトリへpushする。
- [x] 参考画像・現在のSpeakerMiniature・検証Scene・最大16台の性能制約を照合する。
- [x] 共有geometry / materialと、SUB・WOOFER・FULL・MID・HIGHの専用PA構造を設計する。
- [x] Audio・HRTF・TOP / SIDE / POV・UIを変更せず、5種のSpeaker modelだけを差し替える。
- [x] 明るい検証Scene、TOP / SIDE / POV、activity、型検査、production buildで検証する。
- [x] GitHubのmainへSpeaker model更新と検証資料をpushする。
- [x] SUB / WOOFERのhorn chamber、全面baffle、PointLight、HIGH outlineの現在実装を確認する。
- [x] 深いfolded-horn chamber、HIGHの円筒compression driver、MIDの独自front layoutを設計する。
- [x] Speaker renderingだけを限定修正し、1 SpeakerあたりのPointLightを最大1個へ削減する。
- [x] Model Validation、TOP / SIDE / POV、activity、outline位置、最大16台前提を検証する。
- [x] 型検査・production build・GitHub main同期を完了する。
- [x] TOP・POV・SIDE・Speakerのlight、haze、shadow、DPR、activity更新経路を確認する。
- [x] 光の面・帯・円盤とSpeaker PointLightを外す軽量描画方針を設計する。
- [x] Speaker geometry・Audio・3視点操作を変えず、TOP・POV・SIDE・Speaker activityを軽量化する。
- [x] 16 Speaker、TOP / SIDE / POV、activity、型検査、production buildで確認する。
- [x] GitHub mainへ軽量化更新と検証資料をpushする。
- [x] TOPのSpeaker / Listenerドラッグ開始、選択、remove control、座標変換を確認する。
- [x] Pointerイベント競合または座標計算を最小修正し、ドラッグ開始を安定化する。
- [x] TOPのSpeaker / Listener、Gridスナップ、SIDE / POV、Audio不変、型検査、production buildを確認する。
- [x] ドラッグ修正をGitHub mainへpushする。
- [x] 現在のSpeakerNode、voice接続、node解除、channel設定を確認する。
- [x] Speaker入力にexplicit stereo→mono downmix nodeを追加し、接続・解除を更新する。
- [x] 1台mono point source、HRTF stereo、2台独立branch、型検査、production buildを確認する。
- [x] mono downmix routing修正をGitHub mainへpushする。
- [x] 現行TOPのdrag plane、grab offset、Grid、Scene座標更新を確認する。
- [x] Soft Grid、alignment、equal spacing、Listener同距離の候補・hysteresis・guide表示を設計する。
- [x] TOP限定でcontinuous drag、soft snap、Smart Guides、Shift / Alt modifierを実装する。
- [x] 16台、desktop / touch、drag開始、snap解除、guide表示、型検査、production buildを検証する。
- [x] placement UX更新をGitHub mainへpushする。
- [x] Audio sync、AudioParam、activity state、Canvas、drag、POV、SIDE、geometry、bundle、Object URLの現状を計測・確認する。
- [x] 見た目・音・操作感を変えないAudio / React / R3F / pointer / resource最適化設計を確定する。
- [x] Audio sync分割、AudioParam cache、activity局所化、idle RAF、demand renderingを安全に実装する。
- [x] drag / POV / SIDE coalescing、geometry共有、model-lab lazy load、Object URL cleanupを実装する。
- [x] 16台・3視点・再生・操作の差分を測定し、型検査・production buildを通す。
- [x] 性能最適化をGitHub mainへpushし、測定済み・未測定の結果を報告する。
- [x] Speaker state、Inspector Level / Mute、activityStore、下部UI、既存gain minimumを確認する。
- [x] dB mapping、fader clamp、pointer rAF、linked fader、selection、activity subscription、bottom sheetを設計する。
- [x] MIX triggerとTOP / SIDE / POV共通のSpeaker Mixer・vertical fader bankを実装する。
- [x] level / mute同期、selection、linked fader、double-click reset、activity局所更新、desktop / touchを検証する。
- [x] Speaker Mixerを型検査・production build・GitHub main同期まで完了する。
- [x] 現在のactivity overlay、shared material、TOP / POV demand invalidate、performance制約を確認する。
- [x] 部位別emissive mappingとSpeaker単位material instance・invalidate方針を設計する。
- [x] 外部glow / strip / discを撤去し、Speaker本体のemissive materialへ限定置換する。
- [x] TOP / POVのactivity更新、idle復帰、16 Speaker、material数、型検査、production buildを検証する。
- [x] emissive activity visual更新をGitHub mainへpushする。
- [x] 添付指示・参考画像・現行activity・3視点・performance制約を照合する。
- [x] LOW赤→MID黄→HIGH緑の連続周波数profile、部位別material、局所soft haloを設計する。
- [x] Speaker geometry・Audio・Mixerを変えず、frequency emissiveと低負荷haloを実装する。
- [x] TOP / SIDE / POV、idle復帰、16 Speaker、demand rendering、型検査、production buildを検証する。
- [x] 周波数visual更新をGitHub mainと公開チェックポイントへ保存する。
- [x] 現在のエンクロージャーemissive、driver、horn／folded opening、halo配置を確認する。
- [x] SUB・WOOFER・FULL RANGE・MIDのdriver発光と開口部漏光の部位・強度を設計する。
- [x] エンクロージャー発光を撤去し、driver／開口部限定の周波数色・漏光へ修正する。
- [x] 暗所TOP／POV、各type、idle復帰、demand rendering、型検査、production buildを検証する。
- [x] 漏光visual修正をGitHub mainと公開チェックポイントへ保存する。
- [x] 既存の公式音源生成、source picker、再生停止ライフサイクルを確認する。
- [x] 15秒で20 Hzから20 kHzへ上昇するスイープの仕様と終了挙動を設計する。
- [x] 公式サンプル音源としてスイープを実装し、source pickerへ追加する。
- [x] 15秒の周波数遷移、停止・再開始、Speaker response、activity・performanceを検証する。
- [x] スイープ音源更新をGitHub mainと公開チェックポイントへ保存する。
- [x] 現在のapp背景、scene surface、文字色、UI外枠のCSS階層を確認する。
- [x] オフホワイト背景と暗いclub sceneのコントラスト方針を設計する。
- [x] 背景・UI外枠・文字色を限定調整し、音響と3D操作を維持する。
- [x] TOP / SIDE / POV、モバイル可読性、型検査、production buildを検証する。
- [x] オフホワイト背景更新をGitHub mainと公開チェックポイントへ保存する。
- [x] 現在の背景theme、Speaker material、UI操作構成を確認する。
- [x] 背景切替の選択肢とニュートラルグレー模型materialのコントラスト方針を設計する。
- [x] 背景切替UIとneutral gray Speaker materialを実装する。
- [x] 各背景、TOP / SIDE / POV、モバイルで可読性・activity・操作性を検証する。
- [x] 背景切替・グレーSpeaker更新をGitHub mainと公開チェックポイントへ保存する。
- [x] 現在のPOV Canvas、camera、Speaker material、背景theme伝播を確認する。
- [x] Paper／Sand／SlateをPOVの空間感へ反映する背景・床・light方針を設計する。
- [x] POVへtheme伝播とlight／floor paletteを実装し、操作を維持する。
- [x] 各背景のPOV、TOP / SIDE、モバイル、activity、demand renderingを検証する。
- [x] POVテーマ統合をGitHub mainと公開チェックポイントへ保存する。
- [x] 添付仕様全体、Audio graph、Speaker data、Inspector、距離処理を監査する。
- [x] EQ data model、node chain、cache同期、限定的なCUSTOM UIを設計する。
- [x] 4-band EQ DSPとSpeakerごとのstate・差分同期を実装する。
- [x] CUSTOM panel、reset、選択Speaker連携、モバイル表示を実装する。
- [x] 距離高域カットなし、EQ reset、複数Speaker、DSP cache、UIを検証する。
- [x] Custom EQ更新をGitHub mainと公開チェックポイントへ保存する。
- [x] 添付仕様と既存EQ DSP・CUSTOM panel・type filter定義を監査する。
- [x] 共有filter profile、純粋response計算、SVG graph、交点・drag操作を設計する。
- [x] 共有type filter定義とpure response curve calculationを実装する。
- [x] SVG System Response Editor、curve選択、交点・EQ point dragを実装する。
- [x] response整合性、選択・drag、最大16 curve、Audio・performance不変条件を検証する。
- [x] System Response Editor更新をGitHub mainと公開チェックポイントへ保存する。
- [x] 現行Speaker geometry、material、activity glow、Model Lab検証経路を監査する。
- [x] 5 typeのfront／side構造、neutral material、emissive core、local halo配置を設計する。
- [x] FULL／HIGHを再構築し、SUB／WOOFER／MIDの前面構造を整える。
- [x] neutral albedo、emissive core、短距離local haloへactivity glowを刷新する。
- [x] Model Lab全type、TOP／POV idle/active、軽量描画を検証する。
- [x] Speaker geometry・glow刷新をGitHub mainと公開チェックポイントへ保存する。
- [x] 現在のneutral materialとactivity glowの色分離を確認する。
- [x] マットな中間グレーのcabinet・baffle・horn・driver paletteを設計する。
- [x] neutral gray materialへ限定調整し、emissive core・halo・geometryを保持する。
- [x] TOP／POV・Model Lab・activity時の可読性と軽量描画を検証する。
- [x] グレーSpeaker復帰をGitHub mainと公開チェックポイントへ保存する。
- [x] FULL下部の描画構成とTOP／POVでの見え方を監査する。
- [x] 不要な下部geometryを撤去し、reflex portとfeetだけの下部構成へ修正する。
- [x] Model Lab・TOP・POVでFULL下部のsilhouetteと既存activityを検証する。
- [x] FULL下部修正をGitHub mainと公開チェックポイントへ保存する。

## MID キャビネットの前面・下部silhouette修正

- [x] MIDの前面・下部geometryとModel Labでの見え方を監査する。
- [x] 不要な前面・下部geometryを撤去し、horn・compact driver・single reflex portだけの自然な構成へ修正する。
- [x] Model Lab・TOP・POVでMIDのsilhouetteと既存activityを検証する。
- [x] MID修正をGitHub mainと公開チェックポイントへ保存する。

## 実音響geometryと埋め込みactivity表現の再設計

- [x] 添付レビューと現行のhorn・woofer・halo・material構成を照合し、実装差分を確定する。
- [x] 共有のreal horn flare、inner flare emitter、concave woofer cone、埋め込み発光materialを実装する。
- [x] Model LabでFULL・MIDに残る全高taper形状の描画源を特定し、実horn・凹wooferだけが見えるよう修正する。
- [x] Haloを除外した新規Model Lab URLでも同じ全高taper形状が再現することを確認した。
- [x] Scene検査でFULLのcabinetがBoxGeometryへ置換済みであり、taperの描画源は別meshだと確認した。
- [x] Scene検査では中央形状を一意に特定できず、Model Lab専用のgeometry可視化へ切り替えて切り分ける方針にした。
- [x] horn flareとinner emitterを一時非表示にしても全高taperが残るため、horn mesh自体は原因ではないと確認した。
- [x] demand描画の更新依頼後もModel Lab画像が変化しないため、強制再読込で最新Sceneを再検証する必要がある。
- [x] Sceneのhorn flare実寸はFULLで幅0.76・高0.36と正しく、全高taperはhorn geometryではないと再確認した。
- [x] 一時的なModel Lab Scene検査コードを削除し、通常のgeometry確認ビューへ復帰した。
- [x] SUB・WOOFER・FULL・MID・HIGHを物理的な凹形状へ移行し、平面の色付き丸を撤去する。
- [x] Haloを遮蔽対応で非常に弱い補助表現へ変更し、cabinetを少し暗いneutral grayへ整える。
- [x] 停止時のemitter base colorをゼロへ連動させ、OFF-WHITEで色付き丸が残らないよう修正する。
- [x] 全5種のModel Lab、TOP・SIDE・POV、停止時・activity時、最大16台の前提を検証する。
- [x] TOPとSIDEで停止時の中立gray cabinet表示と既存の移動操作を確認した。
- [x] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

## Woofer transform regression修正

- [x] WooferAssemblyのCylinderGeometry軸、scale、前面Z配置と影響Speakerを確認する。
- [x] wooferMountをmodule-levelで前向きに回転し、mesh rotationを撤去する。
- [x] WooferAssemblyのZ積層をfrontZ + .01〜.03へ戻し、cone・emitter・dust capの前後関係を整える。
- [x] FULL／MIDのfront・3/4・sideとPOVでWooferが円形かつcabinet内に収まることを検証する。
- [x] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

## 実再生に基づく帯域別activity発光の調整

- [x] activity取得、speakerBandProfile、emitter material、Halo係数の現状を確認する。
- [x] 再生中にLOW・MID・HIGHの発光面とHaloを比較し、帯域ごとのgainと非線形カーブを調整する。
- [x] TOP・SIDE・POVで停止時と再生時の発光バランスを検証する。
- [x] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

> 初期観察: 実再生ではLOW寄りの公式音源に対し、FULLのWoofer emitterが赤く読める一方、筐体自体は中立grayを保っている。
> 追加観察: 15秒sweepを選択し、20 Hzから20 kHzまでを実再生して帯域ごとの発光量を比較する準備を完了した。
> 調整後のLOW確認: Deep Pulse再生ではFULLのWoofer面が赤く識別でき、cabinetや周囲を赤く塗り替えない状態を確認した。
> 調整後のMID／HIGH確認: 15秒sweepを再開し、中高域・高域へ移る間のhorn emitterとHaloを確認する。
> 高域再確認: 15秒sweepを新規に開始し、精密な待機後にHIGH用high-pass branchの発光量を確認する。
> 実再生検証: Deep Pulseと20 Hz→20 kHz sweepを再生し、LOWのdriver面、MIDの両emitter、HIGHのhorn emitterに対するgain調整を適用した。短時間sweepの終了後はすべて停止時のneutral stateへ復帰することも確認した。
> TOP／SIDE／POV検証: 持続再生できるDeep Pulseへ切り替え、各Viewでのactivity表示確認を開始した。
> TOP／SIDE確認: Deep Pulse再生時も赤いactivityはdriver／hornの近傍に留まり、cabinet全体やfloorへ広がらないことを確認した。
> POV確認: Deep Pulse再生中は局所的なactivity表示を維持し、停止後はすべて中立の非発光状態へ戻ることを確認した。

## POV bass pressure camera vibration

- [x] audio analyser、activity store、PovPreview CameraRig、demand renderingの現状を確認する。
- [x] 20〜160 Hzのfrequency-domain energyをSpeakerごとに収集するlow activity external storeを追加する。
- [x] Listener距離・Speaker type weight・飽和式に基づくbass pressure計算を実装する。
- [x] 1 SUB・複数SUB・HIGHのみ・thresholdを検証するpure bass pressure testを追加する。
- [x] POV cameraだけにthreshold・reduced motion対応の微小vibrationを追加し、audio listenerやUIを不変に保つ。
- [x] 1 SUB・複数SUB・HIGHのみ・距離・Pause・TOP／SIDEで受入条件を検証する。
- [x] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

> POV実再生: Deep PulseをPOVで開始し、3D cameraのみの低域pressure vibrationを確認する準備を完了した。
> POV限定確認: Pause後はPOV cameraが基準姿勢へ戻り、TOPへ切り替えた後はcamera vibrationが一切発生しないことを確認した。

## Physical Speaker Stacking System

- [x] 添付仕様のstack候補、detach、親子追従、3View、audio不変の受入条件を現行実装と照合する。
- [x] speakerDimensions・6m vertical座標・stack tree helper・cycle guard・remove時の子detachを実装する。
- [x] 新規Speakerのfloor spawn、stack高さ解決、親移動時の子孫追従をTOP／SIDE／POVへ統合する。
- [x] TOP dragのstack candidate・吸着preview・dropでの親子化・floor detachを実装する。
- [x] stack tree、循環防止、高さ、親移動、3View、audio graph不変をテスト・視覚検証する。
- [x] stack tree、循環防止、top候補、実寸高さ、remove時のchild継承をpure stack testへ追加する。
- [x] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

## Reggae Sound System Speaker Family + System Preset

- [x] 添付仕様の残りと既存audio・model・stack・UIの統合要件を照合する。
- [x] SpeakerFamily・SpeakerModelId・speakerModels registry・modern fallbackを実装する。
- [x] Reggae Scoop・Kick・Mid Horn・Topの専用geometry、activity面、stylized cabinet voicingを実装する。
- [x] family pickerとReggae Dub Session presetを追加し、stack・TOP・SIDE・POVへ統合する。
- [x] Modern回帰、model別voicing、stack高さ、Reggae preset、3Viewをテスト・視覚検証する。
- [x] Modern fallback、model registry、Reggae preset stack、shared response filter chainをpure model testへ追加する。
- [x] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

> 添付仕様の確定事項: Modern PAはmodelId fallbackで維持し、ReggaeはScoop／Kick／Mid Horn／Topの4モデルを既存kindへ対応させる。DSPはmodel character filter chain→既存Custom EQ→既存gain／analyser／HRTFを共有し、Reggae Sound System presetは明示的なLoad操作でのみ現在sceneを置換する。

## Systemメニューとview switcherの重なり修正

- [x] header・System popover・TOP／SIDE／POV switcherの位置関係を確認する。
- [x] desktopと狭い幅で干渉しない余白・z-index・popover originへ調整する。
- [x] desktop・mobileでSystem popoverとview switcherが重ならないことを確認する。
- [x] 型検査、production build、GitHub main、公開チェックポイントを完了する。

## Tight Bass-Linked POV Vibration Fix

- [x] 添付仕様の二帯域検出・gate・analyser・envelope・stack距離・camera収束条件を現行実装と照合する。
- [x] spatialCoordinatesへaudio座標変換を分離し、bass distanceをstack-aware speaker positionへ統一する。
- [x] 25〜90 Hz中心＋90〜160 Hz補助の二帯域target、gate、fast envelope、Pause収束、RAF停止を実装する。
- [x] POV camera threshold・attack・release・振幅をtight bass挙動へ調整し、reduced motionを維持する。

> 添付仕様のtight bass値: SUB 25–90 Hz、upper bass 90–160 Hzを0.18で補助し、gate 0.035、analyser smoothing 0.35、low envelope attack/release 0.55/0.32、Pause release 0.55、pressure threshold 0.12、camera lambda 15/11、zero snap 0.004を採用する。
- [ ] band・gate・weight・stack距離・Pause・TOP/SIDE非干渉をtestと実再生で検証する。
- [ ] 回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

> 実再生検証: POVでDeep PulseのPlay/Pause操作を完了し、Pause状態へ遷移することを確認した。操作後のbrowser consoleにはruntime errorが記録されていない。cameraの小さな振幅そのものは静止画では定量評価できないため、二帯域・gate・envelope・camera条件は自動testと実装検査で担保する。

## Named Listener Avatar + DJ Booth Avatar

- [x] 添付仕様と現行のListener marker・DJ booth・TOP/SIDE/POVを照合する。
- [x] `ClubListener.name`、localStorage永続化、共有の簡易アバター構成を設計する。
- [x] Listenerの名前編集ラベルと、抽象的なstanding / DJ poseを実装する。
- [x] 3視点へ統合し、Listener drag・orientation・HRTF・既存ステージ操作を保持する。
- [x] 3視点・キーボード操作・型検査・回帰テスト・production buildを確認する。
- [x] GitHub mainと公開チェックポイントへ保存する。

> TOP実機確認: Listenerの人型と頭上の名前、DJ booth（booth・decks・DJ pose）が既存Floorで表示され、名前ラベルをクリックするとインラインinputへ切り替わることを確認した。`taku`へ変更して再読み込みした後も名前が復元され、localStorage永続化が動作している。

> SIDE / POV実機確認: SIDEには名前付きCSS人型とstage側の小さなbooth・DJシルエットが表示された。POVにはListener自身や名前を表示せず、正面のbooth、two decks、mixer、DJの頭・胴体・腕が読めることを確認した。

> Playback実機確認: POVでPlay状態へ切り替え、DJの両腕がdeck / mixer方向へ向くactive poseを確認した。再生操作後のbrowser consoleにはruntime errorがない。DJ専用のRAF / `useFrame` / skeleton animationは追加していない。

## DJ Visibility Correction

- [x] POVのbooth・DJのローカル座標、向き、boothによる遮蔽を再確認する。
- [x] POVでDJがboothの後方から常に上半身まで見える配置へ修正する。
- [x] TOP / SIDE / POV、型検査、production build、GitHub main、公開チェックポイントを確認する。

> POV再確認: booth後方のDJを上方かつ手前へ移し、停止時も頭・胴体・片腕がbooth上部から読めること、再生時は両腕がdeck / mixer方向へ現れることを確認した。

## Optional Speaker Selection

- [ ] 初期選択・空きFloor pointer・Inspectorの現行依存を確認する。
- [x] 初期未選択と空きFloorクリックによるSpeaker選択解除を実装する。
- [x] TOP / SIDE / POV、Inspector、型検査、production build、GitHub main、公開チェックポイントを確認する。

> TOP実機確認: 新規表示時点で選択リングとInspectorがなく、Speaker未選択の状態になっている。Canvas座標を確認してSpeakerを選択すると、そのときだけ選択リング・Remove・Inspectorが表示されることを確認した。続けて空きFloorをクリックすると選択リング・Remove・Inspectorが消え、Speaker未選択へ戻ることを確認した。操作後のbrowser consoleにruntime errorはない。

## Mobile UX + Phone Motion Look

- [x] 添付仕様全文、現行mobile CSS、POV pointer look、permission前提を照合する。
- [x] iOS / Androidの端末姿勢permission、正規化、dead zone、smoothing、cleanupを独立hookで設計する。
- [x] mobile header・stage・view switcher・library dock・Inspector bottom sheetを同一ClubSceneへ適用する。
- [x] POVへMOTION OFF / ON toggleとdevice orientation lookを統合する。
- [x] portrait / landscape / safe area / touch drag / permission拒否 / reduced motionを検証する。
- [x] 型検査、回帰テスト、production build、GitHub main、公開チェックポイントを完了する。

> motion確認: POVにはMOTION OFF controlが常にDOMとしてrenderされ、desktopでは`display: none`で非表示になることを確認した。mobile portraitのcaptureではMOTION OFFを表示し、MIXとの重なりを解消した。実機センサーpermissionはこのsandboxで検証できないため、iOS / Android実機で明示タップからの確認が必要である。

> responsive確認: 390×844のportraitでscene中心・bottom dock・thumb位置view switcher・MOTION controlsを確認した。844×390のlandscape POVもcaptureで確認した。実機のSafari / Chrome permission dialog、実ジャイロ入力、notch / home indicatorは端末での最終確認が必要である。

## Codex Handoff

- [x] 現在のGit SHA・主要構成・test script・公開状態・既知の実機確認項目を確認する。
- [x] Codex向け引き継ぎ書を作成し、変更してはいけない制約と最初の確認手順を記載する。
- [x] 引き継ぎ書をGitHub mainへcommit・pushする。

## Codex Speaker Model Refresh

- [x] `codex/speaker-model-refresh`の差分・親commit・mainとの競合を確認する。
- [x] `009e438`のspeaker model refreshをmainへ統合する。
- [x] 3 view、speaker selection、model test、audio・stack・buildを検証する。
- [x] GitHub mainと公開チェックポイントへ保存する。

> Codex refresh確認: TOP / SIDE / POVで新しいspeaker geometryが表示され、Speaker model・stack・bass・audioの既存testとproduction buildがすべて成功した。音響DSP、stack解決、camera motionの変更は含まれない。
