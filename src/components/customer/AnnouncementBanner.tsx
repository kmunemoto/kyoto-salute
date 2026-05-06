import { useState } from "react";
import { X } from "lucide-react";

const AnnouncementBanner = () => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div
      style={{
        backgroundColor: "#2C2621",
        color: "#FFFFFF",
        fontSize: "14px",
        padding: "12px 40px 12px 16px",
        textAlign: "center",
        position: "relative",
        lineHeight: 1.5,
      }}
    >
      現在Googleマップの店舗情報が一時的に表示されません。当ジムは通常通り営業しております。無料体験のご予約は
      <a
        href="https://kyoto-salute.lovable.app/trial"
        style={{ color: "#0ABAB5", textDecoration: "underline" }}
      >
        こちら
      </a>
      <button
        type="button"
        aria-label="閉じる"
        onClick={() => setVisible(false)}
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: 0,
          color: "#FFFFFF",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AnnouncementBanner;