# Club Craft Web 0.1 — デザインと体験の方針

## 3つの方向性

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Acoustic Topography | 建築の平面図と上質なオーディオ機器を重ねた、明るく触感的なクラブ空間。音を「置く」感覚を最優先にする。 | 0.037 |
| Velvet Listening Room | 深いワイン色とやわらかな布の質感で、夜のリスニングバーを表現する。静かな没入感を中心に据える。 | 0.082 |
| Signal Garden | 草地のような明るい背景に、音のオブジェクトが育つ遊び心ある体験。初心者が試行錯誤しやすい。 | 0.018 |

## 採用する方向性：Acoustic Topography

### Design Movement

**建築プレゼンテーションの平面図**と、1970年代から現代までの**プレミアム・オーディオ機器のインダストリアルデザイン**を組み合わせる。ゲームのような派手さではなく、紙・アルミ・フェルトの触感と、空間を読み解く線を使う。

### Core Principles

1. **音は物体として扱う。** 音源カード、Speaker、Listenerが床の上の明確なオブジェクトとして見える。
2. **最初の3操作で音が変わる。** 音を選ぶ、Speakerを動かす、自分を動かす。この3つ以外を最初に要求しない。
3. **専門用語を表面から隠す。** Routingはドラッグ操作として提示し、gainやmuteは選択後の詳細に置く。
4. **空白は迷いを減らす。** Floor Viewを主役にし、補助情報を周縁へ配置する。

### Color Philosophy

背景は温かい石灰岩のような**暖灰色**。床は少し濃い鉛筆灰。Speakerはオフホワイト、黒鉛、ブラッシュドアルミの中間色で構成する。唯一の署名色は、再生・接続・選択を示す**Signal Vermilion（朱赤）**。赤は警告ではなく、「いま音が流れている」生々しさとして限定的に使う。

### Layout Paradigm

中央を巨大な**Floor View**にし、左端は音源棚、右端は選択中のSpeaker / Routeの薄いインスペクター、下端はtransport barにする。一般的なカードグリッドではなく、作業台の上に置いた「棚・床・操作台」という構造を採用する。

### Signature Elements

1. **等高線のような床のガイド線**：SpeakerとListenerの距離を視覚的に読むための薄い同心線。
2. **物質感のあるSpeaker puck**：種別ごとに異なるリング・切り欠き・ラベルを持つ、置いて動かせる小さな物体。
3. **Signal thread**：選択音源から接続Speakerまで伸びる細い朱赤のライン。

### Interaction Philosophy

すべての重要操作は「つかむ」「置く」「近づく」という物理的な比喩を持つ。ドラッグを終えたときだけ音が確定的に変わり、連続操作中は柔らかく追従する。詳細設定はいつでも閉じられ、初めての人が迷わないことを優先する。

### Animation

Floor上のSpeakerはドラッグ中に1.02倍へごく小さく持ち上がり、離すと180msの`cubic-bezier(0.23, 1, 0.32, 1)`で着地する。再生中のSpeakerは光らず、外周に静かな脈動リングを表示する。音源カードの接続線は120msで描画し、`prefers-reduced-motion`では瞬時に状態を切り替える。

### Typography System

英字の表示・数値には**Space Grotesk**、日本語と説明文には**Noto Sans JP**を使う。大見出しはSpace Grotesk 600、機能ラベルは同フォントの11px・letter spacing広め、本文はNoto Sans JP 400。Interは使用しない。

### Brand Essence

**「音源を床に置き、クラブの中を歩いて音楽を遊ぶためのWeb空間。」**

性格は **tactile / calm / curious**。

### Brand Voice

見出しは短く、命令よりも発見を促す。CTAとマイクロコピーは操作の結果を先に伝える。

> 「音を置く。空間が変わる。」

> 「あなたの場所で、今のミックスを聴く。」

### Wordmark & Logo

ロゴは文字ではなく、**3つの異なる半径の同心円が一箇所だけ開いている印**。音が外へ広がり、Listenerが中へ入ることを示す。ヘッダーでは大きめのアイコンとして使い、faviconにも同じ記号を使う。

### Signature Brand Color

**Signal Vermilion — `#D64B35`**。接続、再生、現在選択中のオブジェクトだけに使う。

## Web 0.1 の音源・Sceneモデル

## Style Decisions

- Floor Viewは常に建築平面図として読めることを優先し、同心等高線、原点マーク、計測線、方位・寸法注記を必須のブランド要素にする。
- Signal Vermilion（`#D64B35`）は再生、選択、Route、Listener、接続Speakerだけに使い、メインの床には少なくとも1本の接続線を見せる。
- copyは「置く、動かす、立つ、聴く、変わる」という身体的な因果関係を短文で示す。
- グレーを全体の基調にし、信号機カラーは状態の意味を持つ操作色に限定する。赤はLIVE・再生・接続、黄はROUTE準備・注意、緑はREADY・正常状態。Speaker種別のMIDは黄、HIGHは緑で物理的なオブジェクトにも控えめに反映する。
- 実機写真の参照を受け、背景は明るい紙面ではなく、黒に近い機材面へ発展させる。光は大きな面塗りではなく、赤・黄・緑・白の小さな拡散LEDとして使う。表面にはガラス、樹脂、金属、ケーブルのような密度を、細いハイライト、内側の影、柔らかな光だまりで再現する。
- ChatGPTモックアップを参照し、次段階ではSOURCE一覧・Top / Side切替・立体的な部屋・Speaker tray・System Balanceを導入する。ただしWeb版は初学者向けのプレイグラウンドであり、RTA、物理出力、複雑なバス設定、プロ向けの多数メーターは加えない。3DはWebGLではなくCSSの遠近感とcabinetオブジェクトで軽く表現し、操作は「音を選ぶ・Speakerを足す・Speaker/Youを動かす」に保つ。
- **現在のWeb 0.3方針**：上記の専門コンソール要素をさらに減らし、Top / Side、System Balance、Routing Matrix、RTAを主画面から外す。一画面のSound System Playgroundとして、中央Floorを最重要にする。選択曲はすべてのSpeakerへ流れ、Type別filter、level、mute、位置、Listenerとの相対距離が音の変化を作る。一般ユーザーに見せる操作は「曲を選ぶ・PLAY・Speakerを足す・SpeakerとYOUを動かす」に絞る。

## Style Decisions

- Signal Vermilionのthreadは、選択曲から選択Speakerへ常時表示する。Routing設定ではなく「音が空間へ置かれている」ことを一目で伝える、Club Craft固有の記号として扱う。
- Floorは中立的なグリッドではなく、距離リング、軸、縮尺、Stage原点をもつ建築的なオーディオ地図として扱う。
- Side panelと小さな操作は、graphite、薄いブラッシュ感、内側の影、小さな発光点を使い、SaaSカードではなく物理的な楽器の操作面として見せる。
- 主要copyは設定語ではなく、身体動作と結果で書く。`choose / place / move / stand / listen / change`を優先する。
- 実3D Floorでは、Listenerと一緒に距離リングを動かし、選択曲 → 選択Speaker → ListenerのSignal Vermilion threadを連続表示する。3Dルームの印象よりも、配置と距離の読み取りを優先する。
- Speakerは色だけで区別せず、SUBの大きいキューブ、WOOFERの横長2ドライバー、FULL RANGEの縦長2way、MIDの小型縦型、HIGHのホーン付き小型筐体という固有のsilhouetteを持たせる。

## 固定Design System — Physical Sound System

Club Craftは、SaaS dashboardではなく、机上で触る**小さな物理サウンドシステム／建築模型**である。画面は一枚の作業面として扱い、Floor Viewを画面の70〜80%の視覚的重要度を持つ主役に据える。音源選択、再生、Speaker追加、選択中のSpeaker調整は、Floorの周囲にある小さな実機の操作部としてのみ配置する。

| 要素 | 固定する判断 |
|---|---|
| 色 | off-white、warm light gray、graphiteを土台にする。Signal Vermilionだけを再生・選択・音の経路に用い、装飾色にはしない。|
| 面と奥行き | 角丸カードや大きい影ではなく、1pxの細い輪郭、わずかな内側の影、紙・樹脂・金属を思わせる面差で深さを作る。|
| レイアウト | パネルを均等に並べない。Floorに面した細い音源レール、上部の静かなtransport、選択時だけ強く読める右側の調整面で構成する。|
| Speaker | UI記号ではなく、無彩色で3Dプリントされた小さなSpeaker cabinetとして扱う。形、寸法、ドライバー構成でTypeを伝える。|
| タイポグラフィ | Space Groteskを機能名・数値、Noto Sans JPを説明文に使う。見出しは抑制し、短い命令より「配置すると変わる」という結果を示す。|
| 動き | hover、press、dragだけに短い物理的フィードバックを与える。光る演出、gradient、neon、ゲーム的な動きは使わない。|

### 禁止事項

gradient、neon、glow、cyberpunk、青紫のAIサービス風配色、pill buttonの連続、無意味なアイコン、大きすぎる見出し、カードの反復を使わない。設計判断に迷ったときは、**「これは楽器の操作面を強めるか、それとも一般的なWebダッシュボードに近づけるか」**で判断する。

### Style Decisions

- Floor Viewの外側の操作面は、薄いgraphiteまたはブラッシュドメタルのインセットプレートとして見せる。汎用カードにはせず、細い刻印ラベルと小さな状態点だけで状態を伝える。
- Speaker Typeは色よりも、cabinet比率、ドライバー、グリル、ホーン、影で判別できることを優先する。
- Signal Vermilionのthreadは、選択音源、選択Speaker、Listenerを常に一続きに結ぶ、Club Craftの最も重要な視覚記号として扱う。

## Floor-Centric Instrument Screen

次のメイン画面では固定Sidebarを廃止する。中央のFloorは大きな余白を含めてviewportの85〜90%の視覚的重要度を持つ、直交投影の建築模型とする。上部中央の現在曲名は曲選択Popoverの唯一の入口にし、Popover内には**Club Craft Picks**と**Upload Audio**だけを表示する。曲一覧は常設せず、選ぶと静かに閉じる。

選択中のSpeakerはFloor右下の小さなFloating Inspectorで調整する。操作はSpeaker Type、Volume、Mute、Removeに限り、数値座標・Routing・計測器・追加設定を出さない。Speaker追加はFloor下端の小さなobject trayに置き、Speakerを「追加する」より「置く」感覚を優先する。

Roomは3面の壁ではなく、薄いfloor surfaceと小さなStageだけで示す。Listenerはtarget iconではなく、白いListening markerと低いgraphite baseとして表現する。距離リングはごく細い1本までに削減する。Signal Vermilion threadは通常時は消し、選択・ドラッグ・再生中だけ短く可視化する。

### Style Decisions

- HeaderのClub Craft lockupは、開いた同心円markと、Space Groteskを使う固有の広いwordmarkを固定の組として扱う。一般的なall-caps見出しにはしない。
- 床図にはgrid、軸、縮尺、Stage referenceを残すが、すべて薄い鉛筆線として扱う。最初に設定を読ませるための技術UIには発展させない。
- Floating InspectorとSpeaker trayは、細いgraphiteのtop rail、控えめな内側のハイライト、刻印のようなlabelを備える、小さな機器の操作プレートとして扱う。

## Height & Headphone Preview

Web版のScene座標は、Top Viewの`x`（左右）、`y`（前後）に`z`（高さ）を加えた正規化3D座標として保持する。Speakerは`{ x, y, z }`、Listenerは将来のorientationを含む`{ position: { x, y, z }, orientation }`として扱う。初期Listenerは`z: 0.5`（耳の高さに相当）へ固定する。Speakerの初期HeightはSUB=FLOOR、WOOFER=LOW、FULL=EAR、MID=HIGH、HIGH=HIGHとするが、Typeによる制約は設けない。

Scene座標をAudio座標へ変換する関数をAudio Hookにだけ置く。Sceneの`x`はAudioの左右`x`、Sceneの`z`はAudioの上下`y`、Sceneの前後`y`はAudioの奥行き`z`へ対応させる。UIの`y`とWeb Audioの`positionY`を直接混ぜない。

Audio Graphは **Source → Speaker Type Filter → Speaker Gain → HRTF PannerNode → Master → Stereo Output** とする。各SpeakerのFilter、Gain、Pannerは追加時に一度だけ生成し、位置・Height・Levelの変更は20〜50msの`AudioParam.setTargetAtTime`で既存Nodeを更新する。modern AudioParamがない実装では、legacy `setPosition` / `setOrientation`へfallbackする。

Floating Inspectorには`FLOOR / LOW / EAR / HIGH / OVERHEAD`の連続Height sliderを置く。数値や角度は常時表示しない。Top ViewのSpeakerはHeightに応じて低いstem、浮き、影のずれでだけ高さを示し、Perspective Editorへ変えない。ヘッドホン利用の案内はPlay周辺に小さく表示する。

## Spatial Installation Direction

以後、Teenage EngineeringやBraunを視覚参照から外す。Club Craftは「美しい物理デバイスのUI」ではなく、**静かな現代的空間オーディオ・インスタレーション**として扱う。UIはできる限り消え、単色のSpeaker模型とその配置だけが視覚的なidentityになる。

main viewportは枠内の灰色Floorではなく、ほぼoff-whiteの連続Canvasにする。Floor grid、stage reference、縮尺、軸、操作ヒントは必要最小限の淡い空間的手掛かりに抑え、CAD・Room Simulator・レベルエディタの印象を避ける。線は淡いneutral gray、影はsoft black、accentは再生・選択・音の活動時だけ使う。

Speakerは単色の精密な建築模型として、丸み、cabinetの比率、woofer、horn、grille、やわらかな接地影でTypeを説明する。色・略称・UI iconに依存しない。選択状態は1px程度のoutlineと少し強い影だけで示し、大きな赤いringは使わない。

Inspectorはborderlessな半透明control surfaceとし、Full Range、Type、Level、Height、Mute、Removeだけを自然な大小の文字で置く。Typeの略称ボタン、機器faceplateのようなtop rail、decorative technical label、bottom speaker legendは撤去する。Typographyはneutral contemporary sans-serifを使用し、uppercaseやmonospaceの演出を避ける。

### Style Decisions

- CanvasにはStageと縮尺を示す淡いspatial anchorを一つだけ残す。操作設定のためのtechnical labelではなく、置かれた音の空間を読むための基準点として扱う。
- Signal Vermilion `#D64B35`は、再生中のSource、短いSignal thread、Play状態だけに現す。待機時のUI装飾や大きな選択ringには使わない。
- Headerのbrand lockupは開いた同心円markと、ゆるやかなspacingを持つClub Craft wordmarkを不可分の組として扱う。控えめだが、default app labelにはしない。

## One Scene, Three Views

TOP、SIDE、POVは別Sceneではない。唯一の`ClubScene`が保持するSpeakerの`position.x / position.y / position.z`と、Listenerの`position`および`orientation`を、3つの表示がそのまま読む。View切替は投影と操作の切替だけであり、Speaker Audio Graph、Audio Source、HRTF PannerNodeを再生成しない。

**TOP**は通常編集面とし、横を`x`、縦を`y`として12×12 gridにsnapする。Topのdragは`x/y`だけを更新し、`z`は保持する。**SIDE**は横を`y`、縦を`z`とする小さな横向き模型である。dragは`y/z`だけを更新し、`x`は保持する。重なった模型は保存値を動かさず、描画上だけ数pixelずらす。TOPとSIDEの選択Speakerは共有する。

**POV**は編集面ではなくListening Previewである。CameraはListenerの`position`から開始し、pointer dragによるyaw/pitchだけを許可する。yaw/pitchはforward vectorに変換し、`AudioListener.forwardX / forwardY / forwardZ`へ同じ値を平滑に送る。TOP / SIDE / POVの小さな文字切替は、現在選択中のViewをweightと短い下線だけで示す。切替は200ms以下のopacity / projection transitionに留め、機能PanelやBlender風カメラにはしない。

## Underground Emergence Direction

Club Craftの暗色はUIテーマではなく、**音が置かれた地下クラブ空間そのもの**である。Floor、stage、grid、room boundaryは必要なときだけ黒に近い灰色で読める。常時目立つneon、HUD、彩色されたgaming effect、恒久的なoutlineは使わない。

Speaker cabinetは黒に近い物理オブジェクトとして通常時にはほとんど闇に溶ける。音が通るときだけDriverのcone、cabinet edge、近くのhazeを、ごく弱いwarm ivory / muted amberの光で現す。活動光はactual audio levelを低速で追従し、瞬間的なflashや照明ショーにしない。Signal Vermilionは再生の短いthreadとPlay状態だけに残す。

Smokeは粒子群ではなく、front/back/heightを読むための薄いsoft hazeである。TOPではfloorの微細な光量差、SIDEでは高さに沿った薄い層、POVでは遠いstageや活動Speakerの周辺でわずかに光を拾う奥行きとして扱う。すべてのViewで同じblack charcoal、smoke gray、soft warm lightを共有する。

操作面はdark translucent glassに近い最小限のsurfaceに留める。文字はsoft gray、borderはほぼ見えない程度、InspectorはSpeakerの存在を邪魔しない。視覚的優先順位は**活動Speaker → 空間配置 → hazeの奥行き → UI**とする。

## Dark Club Direct Manipulation

InspectorはHeaderやbrand markの近くに置かない。TOP / SIDEでは右下の安全領域にだけ現れ、POVでは消す。RemoveはInspector内の文字操作ではなく、選択したSpeaker cabinetの右上へ重なる小さな`×`アイコンにする。誤削除を避けるため、選択中のSpeakerにだけ現す。

Speaker追加はselect inputや文章ではなく、SUB / WOOFER / FULL / MID / HIGHのsilhouetteを示す5つの小さなType iconを左下へ並べる。ユーザーはiconを一度押すだけでSpeakerを追加できる。暗い空間でもアイコンはsoft gray、hover / selectedだけを弱いwarm lightで示す。

停止中のTOPには、音の活動光とは別に、ごく弱いambient fillを残す。これはSpeakerを白く照らすためではなく、cabinet silhouette、Floor、stageを指で選べる最低限の状態にするための光である。再生中には実音声activityによる暖色illuminationが、このbase visibilityの上にのみ加わる。

## PA Miniature and Emergent Activity

Speakerは色ではなく形で読む軽量なClub Craft PA miniatureにする。SUBはwide / low cabinet、WOOFERは厚みのあるlow-mid cabinet、FULLはlower wooferとupper hornを持つtall PA silhouette、MIDは浅くcompact、HIGHは小さくdirectionalなhorn enclosureとする。共通のprimitive geometryと共有materialを使用し、同Typeを複数置いてもtexture、GLB、個別の複雑なmeshを増やさない。各cabinetには小さなbevel、recessed baffle、dark grille、woofer cone / horn throat、feetまたはmount indicationだけを持たせる。

実音声activityはSpeaker Filter後のAnalyser値を使用し、visual updateではType別attack / releaseを適用する。SUBは遅いattackと長いreleaseでfloor付近を広く反応させ、WOOFERは広いfront-face、FULLはbalancedなcabinet rim、MIDは小さく速いfocused response、HIGHは短く狭いhorn周辺の反応にする。Typeの差は色ではなく、時定数・emissive area・local light半径・hazeの広がりで作る。

Hazeは少数の半透明planeだけを用い、個別particle、fog wall、beamを禁止する。活動Speakerの近傍には、音量に連動した極低opacityのhaze haloを短時間出す。TOPではほぼ見せず配置情報を優先し、SIDEでは高さの薄い層として見せ、POVでは遠い物体を暗闇へ沈めながらactive Speaker周辺の空気だけがわずかに読めるようにする。

## Dedicated PA Geometry Replacement

`SpeakerMiniature`の単一Box bodyとflat driver表現は、Type固有のprocedural sub-meshへ置換する。FULLはtapered cabinet shell、recessed baffle well、3層woofer、rectangular horn mouth、depthを持つhorn flare、rear depth、feetで構成する。SUBはwide/deep shell、thick baffle、deep large woofer、bass-reflex slot、heavy feetでFULLとは別のvolumeにする。WOOFERはtall-but-stout deep enclosure、MIDはshallow compact wedge、HIGHはrear capsuleとwide mouth・narrow throatを持つ専用horn enclosureとする。

角はすべてchamfer / bevelを持つが、丸い玩具にはしない。cabinet、baffle/grille、woofer surround / cone / dust-cap、horn exterior / interiorを別materialにする。Three.jsのmodule-level shared `RoundedBoxGeometry`、`CylinderGeometry`、`ConeGeometry`、`Shape + ExtrudeGeometry`をTypeごとに一度だけ作り、instanceではgeometry / materialを再生成しない。

本番のdark renderingに触れず、検証専用routeでneutral lightの5種横並びとFULLのfront / 3/4 / sideを撮る。ラベルを隠しても形で読めること、最大16 instanceでresource共有が保たれることを確認してから本番へ残す。

## TOP Editing Visibility and Frequency Color

TOPは三視点の中で唯一、停止中でも配置編集に必要な可視性を優先する。Speakerごとに小さなneutral base fillを置き、dark charcoal cabinet、Listener、Stage、Floor gridを音声activityなしでも読める状態にする。このfillはSIDEとPOVへ送らない。音声activityが始まると、base fillの上に強い帯域色のdriver / rim / local hazeが重なる。

帯域色はSpeaker TypeのDSP意図を短時間の活動光として可視化する。SUBはdeep red、WOOFERはred-orange、FULL RANGEはwarm yellow、MIDはyellow-green、HIGHはgreenとする。これは常時のcabinet色ではなく、実音声activityがある間だけ出る連続的なvisual gradientである。光の強さはbase fillより明確に高く、音の帯域を見た瞬間に把握できるが、laser、HUD、永続neonにはしない。

## FULL RANGE Reference-Informed PA Form

FULL RANGEは、一般的な縦長2-way PAの構造原理だけを参考にする。Club Craftのオリジナルモデルは、わずかに後方へ傾くtall cabinet、厚い丸角のfront bezel、上部の横長deep horn cavity、下部の大径woofer、前面を覆うindependent perforated grille plane、四隅の小さいfastener detail、控えめなtop mounting recessで構成する。固有のブランド名、logo、具体的な表面意匠は使用しない。frontではhornとwooferの明確な2-way構造、3/4ではcabinet depthとbezel、sideでは縦長の後方傾斜が読めることを合格条件とする。

## Folded-Horn PA Miniature Update

参考画像は既製品のコピーではなく、折り畳みhorn・compression horn・2-way PAという**構造原理と比率**だけを示す。Club Craftの5種は、共通primitiveとmodule-level shared geometry / materialを使う独自のミニチュアとして再構成する。Cabinet、horn exterior、horn interior、woofer surround / cone / dust cap、grille、metal hardwareをroughnessとlight responseで分ける。色は黒に近い単色を保ち、音が鳴るときだけ既存のactivity色をdriver / hornの近傍へ重ねる。

| Type | 固有構造 | 見分けるための最優先要素 |
| --- | --- | --- |
| SUB | 横長で低いdual folded-horn enclosure。2つのhorn mouth、中央の厚いdivider、斜めflare panel、深いthroat、足を持つ。 | 正面にwooferを露出しない、二連hornの開口。 |
| WOOFER | SUBより細く背が高いvertical horn-loaded low-mid cabinet。upper chamberとlower folded mouthを前面で分ける。 | 上下2つのhorn chamberと深い縦長silhouette。 |
| FULL RANGE | わずかにtaperした後方傾斜の2-way PA。upper deep horn、recessed large woofer、下部port、side handleを持つ。 | hornとwooferが独立したprofessional 2-way構成。 |
| MID | FULLより浅く狭いcompact cabinet。比較的大きいdriver、小さなupper horn、2つのlower reflex portを持つ。 | compactな縦型比率とdriverの大きさ。 |
| HIGH | wide rectangular horn mouth、深いflare、狭いthroat、後方のcompression-driver-like bodyを持つhorn専用筐体。 | 側面から読めるhorn mouth → throat → rear body。 |

TOPは操作性を優先するため、Speaker modelの更新後もshadow map、ContactShadows、castShadow、receiveShadowを追加しない。最大16 Speakerではgeometryとmaterialをrender中に生成せず、各Typeが共有するmodule-level objectだけを参照する。

### Validation Finding — Neutral Light

明るい検証routeの初回確認では、FULL RANGEのfront / sideでhorn frame、woofer surround、handleは読める一方、黒いcabinet・horn interiorの階調が暗すぎ、deep hornとmaterial差を評価しにくかった。productionの暗いclub表現は変えず、**validation routeだけ**に前方のneutral key / fillを追加し、exposureを上げて、キャビネットの輪郭・horn flare・woofer recessが中間調でも読める状態にする。

補正後の確認では、FULL RANGEの正面でhorn frame、throat、recessed woofer、lower portが読め、3/4ではcabinet depthとside handleが見える。SUBは二つのhorn mouthと中央dividerを識別できるため、次の調整では斜めflare panelを前寄りの中間色materialでさらに明確にする。HIGHはhorn mouthとrear bodyを確認できるが、小型のため単体validationではcameraを近づける。

### Targeted Geometry and Light Refinement

SUBとWOOFERは前面の全面baffleを持たず、horn mouthの先にflare、開いたthroat、さらに短いtunnel wallと奥のrecessed throatが続く構造へ限定改良する。これは平面的なgrilleの背面ではなく、3/4でmouth → deep chamber → narrowing path → throatを読めるための実メッシュである。HIGHの後方bodyはBoxではなく、neck、cylindrical compression-driver body、rear magnet housingを連結する。MIDはFULLと異なる低く浅いfront layoutと、wide horn、相対的に大きいdriver、single horizontal portを持つ。

activity用PointLightは各Speakerのfrontに一つだけ残す。hornとwoofer内部の追加PointLight、停止時のidle fill PointLightは使わず、activity haze、共有light、既存materialの面差で読みやすさを保つ。FULLのselection / idle edgeだけはmodelと同じ後方傾斜を適用し、HIGHはcabinet offsetを除いてshell / edge / actual modelの基準座標を統一する。

### 音源入力

| 種別 | 表示 | 保存・公開 |
|---|---|---|
| 公式音源 | `OFFICIAL SOUNDS`の音源カード | 権利確認済みの開発者配信音源。初期デモではブラウザ生成音も利用できる。 |
| ローカル音源 | `MY SOUNDS +`から選ぶ | ユーザーの端末で選択した音声ファイル。初期状態ではサーバーへ送らず、ブラウザの実行中だけ利用する。 |

### 最小Sceneデータ

```ts
type SpeakerKind = 'sub' | 'woofer' | 'full' | 'mid' | 'high'

type Speaker = {
  id: string
  kind: SpeakerKind
  x: number
  y: number
  level: number
}

type SoundSource = {
  id: string
  name: string
  category: 'official' | 'local'
  color: string
  enabled: boolean
}

type Route = {
  sourceId: string
  speakerId: string
  gain: number
  muted: boolean
}

type ClubScene = {
  speakers: Speaker[]
  listener: { x: number; y: number }
  routes: Route[]
}
```

## Web 0.1の非目標

- 物理5.1 / 7.1 / 8ch出力
- YouTubeやBandcampのURLからの音声取り込み
- DAW、VST3、AUとの直接接続
- RTA、精密EQ、制作向けメーター
- 他人のローカル音源の自動アップロードや公開
