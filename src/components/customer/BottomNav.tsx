import { Home, CalendarDays, MessageCircle, Utensils, Dumbbell, Settings } from "lucide-react";
import type { CustomerTab } from "./CustomerView";

interface BottomNavProps {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  unreadChat?: number;
}

const tabs: { id: CustomerTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "ホーム", icon: Home },
  { id: "booking", label: "予約", icon: CalendarDays },
  { id: "training", label: "記録", icon: Dumbbell },
  { id: "meals", label: "食事", icon: Utensils },
  { id: "chat", label: "チャット", icon: MessageCircle },
  { id: "settings", label: "設定", icon: Settings },
];

const BottomNav = ({ activeTab, onTabChange, unreadChat = 0 }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((t) => {
          const active = activeTab === t.id;
          const showBadge = t.id === "chat" && unreadChat > 0;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200 ${
                active
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <t.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                    {unreadChat}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold">{t.label}</span>
              {active && (
                <div className="w-1 h-1 rounded-full bg-accent mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
