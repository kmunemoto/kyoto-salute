import type { Keypoint } from "./types";

const MIN_SCORE = 0.3;

// MoveNet COCO keypoint indices
const KP = {
  NOSE: 0,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
} as const;

type Feedback = {
  type: "good" | "warning";
  message: string;
};

function isValid(kp: Keypoint | undefined): kp is Keypoint {
  return !!kp && (kp.score ?? 1) >= MIN_SCORE;
}

/** Normalize difference by image height to make threshold resolution-independent */
function relDiff(a: Keypoint, b: Keypoint, imgHeight: number) {
  return (a.y - b.y) / imgHeight;
}

export function analyzePosture(
  keypoints: Keypoint[],
  imgNatHeight: number
): Feedback[] {
  const feedback: Feedback[] = [];
  const THRESHOLD = 0.03; // 3% of image height

  // --- Shoulders ---
  const ls = keypoints[KP.LEFT_SHOULDER];
  const rs = keypoints[KP.RIGHT_SHOULDER];
  if (isValid(ls) && isValid(rs)) {
    const diff = relDiff(ls, rs, imgNatHeight);
    if (Math.abs(diff) > THRESHOLD) {
      // In image coords, larger Y = lower position
      feedback.push({
        type: "warning",
        message:
          diff > 0
            ? "左肩が少し下がっている傾向があります。"
            : "右肩が少し下がっている傾向があります。",
      });
    }
  }

  // --- Hips ---
  const lh = keypoints[KP.LEFT_HIP];
  const rh = keypoints[KP.RIGHT_HIP];
  if (isValid(lh) && isValid(rh)) {
    const diff = relDiff(lh, rh, imgNatHeight);
    if (Math.abs(diff) > THRESHOLD) {
      feedback.push({
        type: "warning",
        message:
          diff > 0
            ? "右の骨盤が少し上がっているようです。"
            : "左の骨盤が少し上がっているようです。",
      });
    }
  }

  // --- Head tilt (ears) ---
  const le = keypoints[KP.LEFT_EAR];
  const re = keypoints[KP.RIGHT_EAR];
  if (isValid(le) && isValid(re)) {
    const diff = relDiff(le, re, imgNatHeight);
    if (Math.abs(diff) > THRESHOLD) {
      feedback.push({
        type: "warning",
        message:
          diff > 0
            ? "頭が少し右に傾いています。"
            : "頭が少し左に傾いています。",
      });
    }
  }

  // --- Forward head (nose vs shoulder midpoint) ---
  const nose = keypoints[KP.NOSE];
  if (isValid(nose) && isValid(ls) && isValid(rs)) {
    const shoulderMidY = (ls.y + rs.y) / 2;
    const noseToShoulder = (shoulderMidY - nose.y) / imgNatHeight;
    if (noseToShoulder < 0.05) {
      feedback.push({
        type: "warning",
        message: "頭が前方に出ている傾向（ストレートネック気味）があります。",
      });
    }
  }

  if (feedback.length === 0) {
    feedback.push({
      type: "good",
      message: "左右のバランスが取れた綺麗な姿勢です！",
    });
  }

  return feedback;
}
