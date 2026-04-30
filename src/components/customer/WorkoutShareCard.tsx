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

    const isDark = theme === "dark";
    const isLight = theme === "light";
    const isTransparent = theme === "transparent";

    const bg = isDark ? "#0F0F0F" : isLight ? "#FAF9F6" : "transparent";
    const fg = isLight ? "#0F0F0F" : "#FFFFFF";
    const muted = isLight ? "rgba(15,15,15,0.55)" : "rgba(255,255,255,0.65)";
    const accent = "#0ABAB5";

    // Drop shadow for transparent variant so text reads on photos
    const shadow = isTransparent
      ? "0 2px 8px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.6)"
      : "none";

    const dateStr = formatShareDate(session.date);

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
          padding: "180px 100px 120px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          textShadow: shadow,
        }}
      >
        {/* Stats stack — left aligned, top third */}
        <div style={{ display: "flex", flexDirection: "column", gap: 110 }}>
          {/* TIME */}
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 300,
                letterSpacing: "0.45em",
                color: muted,
                marginBottom: 28,
              }}
            >
              TIME
            </div>
            <div
              style={{
                fontSize: 220,
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                color: fg,
              }}
            >
              {session.durationMin}
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 300,
                  marginLeft: 18,
                  color: muted,
                  letterSpacing: "0.05em",
                }}
              >
                min
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              height: 2,
              background: accent,
              width: "100%",
              boxShadow: "none",
            }}
          />

          {/* TOTAL VOLUME */}
          <div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 300,
                letterSpacing: "0.45em",
                color: muted,
                marginBottom: 28,
              }}
            >
              TOTAL VOLUME
            </div>
            <div
              style={{
                fontSize: 220,
                fontWeight: 900,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
                color: accent,
              }}
            >
              {session.totalVolume.toLocaleString()}
              <span
                style={{
                  fontSize: 72,
                  fontWeight: 300,
                  marginLeft: 18,
                  color: muted,
                  letterSpacing: "0.05em",
                }}
              >
                kg
              </span>
            </div>
          </div>

          {/* DATE */}
          <div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 400,
                letterSpacing: "0.18em",
                color: fg,
                opacity: 0.95,
              }}
            >
              {dateStr}
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Footer logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
          }}
        >
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt=""
              crossOrigin="anonymous"
              style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 10 }}
            />
          )}
          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: fg,
                lineHeight: 1.1,
                letterSpacing: "0.02em",
              }}
            >
              Salute 御所南
            </div>
            <div
              style={{
                fontSize: 16,
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
