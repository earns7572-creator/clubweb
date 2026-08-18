# Club Craft Web — 性能最適化記録

## 方針

この変更は、見た目、音響特性、配置規則、既存の操作方法を変えずに、更新範囲とidle時の仕事量を減らすことだけを目的とします。

| 領域 | 実装した最適化 | 保持したもの |
| --- | --- | --- |
| Web Audio | topology / DSP / Speaker position / Listener position / orientationを分割し、AudioParam cacheを使用 | mono input、Type filter、HRTF、distance model、stereo master |
| activity | external storeでScene projectionだけを更新し、停止後のresidualが消えたらRAF停止 | 既存の周波数色とenvelope |
| Canvas | TOP / POVを`frameloop="demand"` | camera、lighting、Speaker geometry、dark club look |
| pointer | TOP / SIDE drag、POV lookを1 frame最大1回へcoalesce | grab offset、Soft Grid、Smart Guides、操作感 |
| resource | blueprint cabinetの重複生成を除去、model-lab lazy load、Object URL cleanup | 5種類のSpeaker形状、通常routeの機能 |

## 実測した項目

| 項目 | 結果 | 注記 |
| --- | --- | --- |
| TypeScript | `pnpm check` 成功 | 実装後に確認 |
| Soft Placement | `pnpm test:placement` 成功 | Grid / guideの既存テスト |
| Performance architecture | `pnpm test:performance` 成功 | 分割sync、demand Canvas、coalescing、lazy load、shared geometryを静的に確認 |
| Production build | 成功 | Vite production build |
| Main JS | `1,607.22 kB` / gzip `448.84 kB` | production buildの出力 |
| Model-lab | `5.67 kB` / gzip `1.42 kB` のlazy chunk | 通常route初期読み込みから分離 |

## 未測定の項目

この環境では、実ユーザー操作を伴うChrome Performance traceを記録していません。そのためFPS、frame time、CPU使用率、GC回数を数値として主張しません。公開後は、同一端末・同一Chrome版・同一画面サイズで、TOP idle、TOP 16 Speaker drag、POV look、音源再生中の4ケースをPerformance panelで比較してください。
