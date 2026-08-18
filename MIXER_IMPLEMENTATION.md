# Speaker Mixer / Vertical Fader Bank

## 役割

Mixerは新しい音響エンジンではありません。既存の`ClubSpeaker`にある`level`と`muted`を、複数Speaker分だけ並べて操作するための二次的なcontrol surfaceです。

| 項目 | 実装 |
| --- | --- |
| 開閉 | 右下の`MIX`から開く、30〜36vhのnative bottom sheet |
| Channel strip | Type、short identity、activity meter、vertical fader、dB表示、Mute |
| level | 既存`speaker.level`のみ。linear `1.0 = 0 dB` |
| 下限 | `0.02`（約`−34 dB`）。完全無音は既存Muteのみ |
| linked | Shift+clickでgroupを選び、faderのdB差分を相対的に適用 |
| reset | faderをdouble-clickすると、そのchannelだけ0 dBへ戻す |
| activity | 既存`activityStore`のlocal subscription。新しいAnalyserNodeなし |
| pointer | pointer capture + latest target + rAF。1 frameに最大1 state update |

## 検証

`pnpm test:mixer`はlinear / dB変換、0 dB上限、safe minimum、relative linked gainの基本計算を確認します。`pnpm test:performance`はMixerが新しいAudioNodeやVaul dependencyを持たず、activity local subscriptionとrAF pointer coalescingを使うことを静的に確認します。
