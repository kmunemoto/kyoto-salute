import { forwardRef } from "react";
import { useGymSettings } from "@/hooks/useGymSettings";
import { formatShareDate, volumeMetaphor, type WorkoutSession } from "@/lib/workoutShare";

export type ShareTheme = "dark" | "light" | "transparent";

interface Props {
  session: WorkoutSession;
  theme: ShareTheme;
  streakWeeks: number;
  totalSessions: number;
}

const WorkoutShareCard = forwardRef<HTMLDivElement, Props>(
  ({ session, theme, streakWeeks, totalSessions }, ref) => {
    const { settings } = useGymSettings();

    const isDark = theme === "dark";
    const isLight = theme === "light";
    const isTransparent = theme === "transparent";

    const bg = isDark ? "#0F0F0F" : isLight ? "#FAFAF7" : "transparent";
    const fg = isLight ? "#0F0F0F" : "#FFFFFF";
    const muted = isLight ? "rgba(15,15,15,0.55)" : "rgba(255,255,255,0.6)";
    const border = isLight ? "rgba(15,15,15,0.1)" : "rgba(255,255,255,0.15)";
    const accent = "#0ABAB5";

    const dateStr = formatShareDate(session.date);
    const metaphor = volumeMetaphor(session.totalVolume);

    return (
      <div
        ref={ref}
        style={{
          width: 1080,
          height: 1920,
          background: bg,
          color: fg,
          fontFamily:
            "'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif",
          padding: "120px 100px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          letterSpacing: "0.01em",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 80 }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: "0.4em",
              color: accent,
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            WORKOUT COMPLETE
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: fg }}>
            {dateStr}
          </div>
        </div>

        {/* Main stats */}
        <div style={{ marginBottom: 70 }}>
          <div style={{ display: "flex", gap: 60, marginBottom: 50 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, color: muted, fontWeight: 600, marginBottom: 12, letterSpacing: "0.15em" }}>
                TIME
              </div>
              <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1 }}>
                {session.durationMin}
                <span style={{ fontSize: 36, fontWeight: 700, marginLeft: 10, color: muted }}>min</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, color: muted, fontWeight: 600, marginBottom: 12, letterSpacing: "0.15em" }}>
                EXERCISES
              </div>
              <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1 }}>
                {session.exerciseCount}
                <span style={{ fontSize: 36, fontWeight: 700, marginLeft: 10, color: muted }}>種目</span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: `2px solid ${accent}`,
              paddingTop: 36,
              marginTop: 12,
            }}
          >
            <div style={{ fontSize: 22, color: muted, fontWeight: 600, marginBottom: 16, letterSpacing: "0.15em" }}>
              TOTAL VOLUME
            </div>
            <div style={{ fontSize: 140, fontWeight: 900, lineHeight: 1, color: accent }}>
              {session.totalVolume.toLocaleString()}
              <span style={{ fontSize: 56, fontWeight: 800, marginLeft: 14 }}>kg</span>
            </div>
            {metaphor && (
              <div style={{ fontSize: 32, fontWeight: 600, marginTop: 24, color: fg, opacity: 0.85 }}>
                ≒ {metaphor}
              </div>
            )}
            <div style={{ fontSize: 26, color: muted, fontWeight: 600, marginTop: 18 }}>
              {session.totalSets} sets total
            </div>
          </div>
        </div>

        {/* Exercises list */}
        <div style={{ flex: 1, marginBottom: 60 }}>
          <div style={{ fontSize: 22, color: muted, fontWeight: 600, marginBottom: 24, letterSpacing: "0.15em" }}>
            EXERCISES
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {session.exercises.slice(0, 7).map((ex) => (
              <div
                key={ex.exercise_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 16,
                  borderBottom: `1px solid ${border}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 20, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 34, fontWeight: 700, color: fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ex.exercise_name}
                  </div>
                  {ex.isPR && (
                    <div
                      style={{
                        background: accent,
                        color: "#FFFFFF",
                        fontSize: 20,
                        fontWeight: 800,
                        padding: "6px 14px",
                        borderRadius: 999,
                        letterSpacing: "0.1em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      🏆 PR
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: fg, whiteSpace: "nowrap" }}>
                  {ex.maxWeight}
                  <span style={{ fontSize: 22, color: muted, marginLeft: 4 }}>kg</span>
                  <span style={{ marginLeft: 16, color: muted, fontSize: 24 }}>×</span>
                  <span style={{ marginLeft: 12 }}>{ex.totalReps}</span>
                </div>
              </div>
            ))}
            {session.exercises.length > 7 && (
              <div style={{ fontSize: 24, color: muted, fontWeight: 600 }}>
                +{session.exercises.length - 7} more
              </div>
            )}
          </div>
        </div>

        {/* Streak + sessions */}
        <div
          style={{
            display: "flex",
            gap: 30,
            marginBottom: 60,
          }}
        >
          <div
            style={{
              flex: 1,
              border: `2px solid ${accent}`,
              borderRadius: 24,
              padding: "24px 28px",
              background: isTransparent ? "rgba(10,186,181,0.12)" : isDark ? "rgba(10,186,181,0.1)" : "rgba(10,186,181,0.08)",
            }}
          >
            <div style={{ fontSize: 22, color: muted, fontWeight: 600, marginBottom: 8, letterSpacing: "0.1em" }}>
              STREAK
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: fg }}>
              🔥 {streakWeeks}週連続
            </div>
          </div>
          <div
            style={{
              flex: 1,
              border: `2px solid ${border}`,
              borderRadius: 24,
              padding: "24px 28px",
            }}
          >
            <div style={{ fontSize: 22, color: muted, fontWeight: 600, marginBottom: 8, letterSpacing: "0.1em" }}>
              SESSION
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: fg }}>
              #{totalSessions}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            paddingTop: 32,
            borderTop: `1px solid ${border}`,
          }}
        >
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 64, height: 64, objectFit: "contain", borderRadius: 12 }}
            />
          )}
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1.1 }}>
              Salute 御所南
            </div>
            <div style={{ fontSize: 18, color: muted, fontWeight: 600, letterSpacing: "0.3em", marginTop: 6 }}>
              PERSONAL GYM
            </div>
          </div>
        </div>
      </div>
    );
  }
);

WorkoutShareCard.displayName = "WorkoutShareCard";

export default WorkoutShareCard;