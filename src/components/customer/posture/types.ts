export type Keypoint = { x: number; y: number; score?: number; name?: string };

export type PostureFeedback = {
  type: "good" | "warning";
  message: string;
};
