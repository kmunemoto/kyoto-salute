import { getMuscleGroup } from "@/lib/muscleGroup";

interface Props {
  exerciseName: string;
  className?: string;
}

const MuscleGroupBadge = ({ exerciseName, className }: Props) => {
  const group = getMuscleGroup(exerciseName);
  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "rgba(10, 186, 181, 0.1)",
        color: "#0ABAB5",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "4px",
        lineHeight: 1.4,
        whiteSpace: "nowrap",
      }}
    >
      {group}
    </span>
  );
};

export default MuscleGroupBadge;