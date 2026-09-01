export const CABINET_COLOR_PRESETS = [
  { id: "graphite", label: "GRAPHITE", value: "#3f423f" },
  { id: "ash", label: "ASH", value: "#777b78" },
  { id: "off-white", label: "OFF WHITE", value: "#d8d6ce" },
  { id: "raw-gray", label: "RAW GRAY", value: "#989a96" },
] as const;

export type CabinetColorScope = "this" | "stack" | "all";

export const DEFAULT_CABINET_COLOR = CABINET_COLOR_PRESETS[0].value;

export function normalizeCabinetColor(value: string | undefined | null) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || !/^#[0-9a-f]{6}$/.test(normalized)) {
    return DEFAULT_CABINET_COLOR;
  }
  return normalized;
}

export function isGlbCabinetShellName(name: string) {
  return /^cabinet(?:$|[_\s-])/i.test(name);
}

export function cabinetColorTargetIds(
  speakers: ReadonlyArray<{ id: string; stackParentId?: string | null }>,
  selectedId: string,
  scope: CabinetColorScope
) {
  if (scope === "all") return new Set(speakers.map(speaker => speaker.id));
  if (scope === "this") return new Set([selectedId]);
  const byId = new Map(speakers.map(speaker => [speaker.id, speaker]));
  let rootId = selectedId;
  const visited = new Set<string>();
  while (byId.get(rootId)?.stackParentId && !visited.has(rootId)) {
    visited.add(rootId);
    rootId = byId.get(rootId)!.stackParentId!;
  }
  const result = new Set([rootId]);
  let changed = true;
  while (changed) {
    changed = false;
    speakers.forEach(speaker => {
      if (speaker.stackParentId && result.has(speaker.stackParentId) && !result.has(speaker.id)) {
        result.add(speaker.id);
        changed = true;
      }
    });
  }
  return result;
}
