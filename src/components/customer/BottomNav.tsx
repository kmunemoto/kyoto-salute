import { Home, CalendarDays, Camera, MessageCircle, Utensils } from "lucide-react";
import type { CustomerTab } from "./CustomerView";

interface BottomNavProps {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}

const tabs: { id: CustomerTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "ホーム", icon: Home },
  { id: "booking", label: "予約", icon: CalendarDays },
  { id: "meals", label: "食事", icon: Utensils },
  { id: "photos", label: "写真", icon: Camera },
  { id: "chat", label: "チャット", icon: MessageCircle },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((t) => {
          const active = activeTab === t.id;
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
              <t.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
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
