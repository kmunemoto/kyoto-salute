import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PostureFeedback } from "./types";

type Props = {
  feedbacks: PostureFeedback[];
};

const PostureFeedbackCard = ({ feedbacks }: Props) => {
  if (feedbacks.length === 0) return null;

  const allGood = feedbacks.every((f) => f.type === "good");

  return (
    <Card className={allGood ? "border-accent/40 bg-accent/5" : "border-warning/40 bg-warning/5"}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>AIからの姿勢アドバイス</span>
        </div>
        <ul className="space-y-2">
          {feedbacks.map((fb, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              {fb.type === "good" ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-accent" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
              )}
              <span>{fb.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default PostureFeedbackCard;
