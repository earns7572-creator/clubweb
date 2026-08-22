/* Club Craft spatial rule: audio, bass pressure, and stack geometry resolve the same Speaker center position. */
import type { ClubSpeaker, Position3D } from "@/hooks/useClubAudio";
import { createStackResolver } from "@/lib/speakerStacking";

export type AudioPosition = { x: number; y: number; z: number };
/** Maps the saved normalized listener height to a physical ear height in meters. */
export function listenerEarHeightMeters(z: number): number { return 1.10 + z * 1.10; }
export function sceneToAudioPosition(position: Position3D): AudioPosition { return { x: (position.x - .5) * 9, y: listenerEarHeightMeters(position.z), z: (position.y - .5) * 9 }; }
export function speakerToAudioPosition(speaker: ClubSpeaker, speakers: ClubSpeaker[]): AudioPosition { const resolver = createStackResolver(speakers); const xy = resolver.getXY(speaker); return { x: (xy.x - .5) * 9, y: resolver.getCenterMeters(speaker), z: (xy.y - .5) * 9 }; }
