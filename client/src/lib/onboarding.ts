export type OnboardingStep = "speaker" | "place" | "sound" | "play" | "complete";

export function isSupportedMusicFile(file: Pick<File, "name" | "type">) {
  const extension = file.name.toLowerCase().split(".").pop();
  return extension === "mp3" || extension === "wav" || file.type === "audio/mpeg" || file.type === "audio/wav" || file.type === "audio/x-wav";
}
