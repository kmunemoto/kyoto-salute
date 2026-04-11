import { LayoutDashboard, Users, CalendarDays, MessageCircle, Dumbbell, Settings2 } from "lucide-react";
import type { TrainerTab } from "./TrainerView";

interface TrainerSidebarProps {
  activeTab: TrainerTab;
  onTabChange: (tab: TrainerTab) => void;
  unreadMessages?: number;
}

const desktopTabs: { id: TrainerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { id: "clients", label: "顧客一覧", icon: Users },
  { id: "schedule", label: "予約管理", icon: CalendarDays },
  { id: "messages", label: "メッセージ", icon: MessageCircle },
  { id: "exercises", label: "種目設定", icon: Dumbbell },
  { id: "gym-settings", label: "ジム設定", icon: Settings2 },
];

const mobileTabs: { id: TrainerTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { id: "clients", label: "顧客一覧", icon: Users },
  { id: "schedule", label: "予約管理", icon: CalendarDays },
  { id: "exercises", label: "種目設定", icon: Dumbbell },
  { id: "gym-settings", label: "ジム設定", icon: Settings2 },
];

const TrainerSidebar = ({ activeTab, onTabChange, unreadMessages = 0 }: TrainerSidebarProps) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-60 flex-col gap-1 p-4 border-r border-border bg-card/60 backdrop-blur-xl z-30">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-3">メニュー</p>
        {tabs.map((t) => {
          const active = activeTab === t.id;
          const showBadge = t.id === "messages" && unreadMessages > 0;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="w-4.5 h-4.5" />
              {t.label}
              {showBadge && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadMessages}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-border">
        <div className="flex">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            const showBadge = t.id === "messages" && unreadMessages > 0;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all duration-200 relative ${
                  active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <t.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                  {showBadge && (
                    <span className="absolute -top-1.5 -right-2.5 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
                      {unreadMessages}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default TrainerSidebar;
