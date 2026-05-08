export interface EmoteCatalogItem {
  item_key: string;
  name: string;
  price: number;
  src: string;
}

export const getEmoteVideoSrc = (itemKey?: string | null): string | null => {
  if (!itemKey) return null;
  if (!itemKey.startsWith("emote_")) return null;
  const name = itemKey.slice("emote_".length);
  return `/emotes/${name}.mp4`;
};