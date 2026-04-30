import { forwardRef } from "react";
import { useGymSettings } from "@/hooks/useGymSettings";
import { formatShareDate, type WorkoutSession } from "@/lib/workoutShare";

export type ShareTheme = "dark" | "light" | "transparent";

interface Props {
  session: WorkoutSession;
  theme: ShareTheme;
  streakWeeks: number;
  totalSessions: number;
}

const WorkoutShareCard = forwardRef<HTMLDivElement, Props>(
  ({ session, theme }, ref) => {
    const { settings } = useGymSettings();

    const isLight = theme === "light";
    const isTransparent = theme === "transparent";

    const bg = isTransparent ? "transparent" : isLight ? "#FAF9F6" : "#0F0F0F";
    const fg = isLight ? "#0F0F0F" : "#FFFFFF";
    const muted = isLight ? "rgba(15,15,15,0.5)" : "rgba(255,255,255,0.6)";
    const subtle = isLight ? "rgba(15,15,15,0.12)" : "rgba(255,255,255,0.15)";
    const accent = "#0ABAB5";

    const shadow = isTransparent
      ? "0 2px 8px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.6)"
      : "none";

    const dateStr = formatShareDate(session.date);
    const visibleExercises = session.exercises.slice(0, 6);
    const hiddenCount = session.exercises.length - visibleExercises.length;

    const labelStyle = {
      fontSize: 22,
      fontWeight: 300,
      letterSpacing: "0.4em",
      color: muted,
      marginBottom: 18,
    } as const;

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
          padding: "160px 100px 120px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          textShadow: shadow,
        }}
      >
        {/* TIME */}
        <div style={{ marginBottom: 56 }}>
          <div style={labelStyle}>TIME</div>
          <div
            style={{
              fontSize: 110,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: fg,
            }}
          >
            {session.durationMin}
            <span
              style={{
                fontSize: 40,
                fontWeight: 300,
                marginLeft: 14,
                color: muted,
                letterSpacing: "0.05em",
              }}
            >
              min
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 2, background: accent, width: "100%", marginBottom: 56 }} />

        {/* TOTAL VOLUME */}
        <div style={{ marginBottom: 64 }}>
          <div style={labelStyle}>TOTAL VOLUME</div>
          <div
            style={{
              fontSize: 110,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.02em",
              color: accent,
            }}
          >
            {session.totalVolume.toLocaleString()}
            <span
              style={{
                fontSize: 40,
                fontWeight: 300,
                marginLeft: 14,
                color: muted,
                letterSpacing: "0.05em",
              }}
            >
              kg
            </span>
          </div>
        </div>

        {/* EXERCISES */}
        {visibleExercises.length > 0 && (
          <div style={{ marginBottom: 56 }}>
            <div style={labelStyle}>EXERCISES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {visibleExercises.map((ex) => (
                <div
                  key={ex.exercise_id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 12,
                    borderBottom: `1px solid ${subtle}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 30,
                        fontWeight: 500,
                        color: fg,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ex.exercise_name}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 600,
                      color: fg,
                      whiteSpace: "nowrap",
                      marginLeft: 16,
                    }}
                  >
                    {ex.maxWeight}
                    <span style={{ fontSize: 20, color: muted, marginLeft: 4, fontWeight: 300 }}>
                      kg
                    </span>
                    <span style={{ margin: "0 10px", color: muted, fontWeight: 300 }}>×</span>
                    {ex.totalReps}
                  </div>
                </div>
              ))}
              {hiddenCount > 0 && (
                <div style={{ fontSize: 22, color: muted, fontWeight: 300, marginTop: 4 }}>
                  +{hiddenCount} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* DATE */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: "0.2em",
            color: fg,
            opacity: 0.9,
          }}
        >
          {dateStr}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 52, height: 52, objectFit: "contain", borderRadius: 10 }}
            />
          )}
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: fg,
                lineHeight: 1.1,
                letterSpacing: "0.02em",
              }}
            >
              Salute 御所南
            </div>
            <div
              style={{
                fontSize: 14,
                color: muted,
                fontWeight: 300,
                letterSpacing: "0.45em",
                marginTop: 6,
              }}
            >
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
