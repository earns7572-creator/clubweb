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
