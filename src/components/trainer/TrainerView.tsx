import { useState, useEffect } from "react";
import { LogOut, Settings } from "lucide-react";

import TrainerSidebar from "./TrainerSidebar";
import TrainerDashboard from "./TrainerDashboard";
import TrainerClientList from "./TrainerClientList";
import TrainerClientDetail from "./TrainerClientDetail";
import TrainerSchedule from "./TrainerSchedule";
import TrainerMessages from "./TrainerMessages";
import TrainerNotificationSettings from "./TrainerNotificationSettings";
import TrainerExerciseManager from "./TrainerExerciseManager";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export type TrainerTab = "dashboard" | "clients" | "schedule" | "messages" | "settings" | "exercises";

// Dummy unread count
const DUMMY_UNREAD = 3;

const TrainerView = () => {
  const [tab, setTab] = useState<TrainerTab>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(DUMMY_UNREAD);
  const { signOut } = useAuth();

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setTab("clients");
  };

  const handleBackToList = () => {
    setSelectedClientId(null);
  };

  // Simulate an incoming message toast after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      toast("田中 太郎 様から新着メッセージがあります", {
        description: "「明日のトレーニング楽しみです！」",
        action: {
          label: "確認する",
          onClick: () => {
            setTab("messages");
          },
        },
      });
      setUnreadMessages((prev) => prev + 1);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Clear unread when viewing messages
  useEffect(() => {
    if (tab === "messages") {
      setUnreadMessages(0);
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header — アプリ名は「パーソナルジムSalute御所南」で固定。絶対にカタカナに変更しないこと！ */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground">LOGO</div>
            <span className="text-sm font-bold">パーソナルジムSalute御所南 管理画面</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setTab("settings")} className="text-muted-foreground">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-1" />
              ログアウト
            </Button>
          </div>
        </div>
      </div>
      <div className="pt-12">
        <div className="flex">
          <TrainerSidebar
            activeTab={tab}
            onTabChange={(t) => { setTab(t); setSelectedClientId(null); }}
            unreadMessages={unreadMessages}
          />
          <main className="flex-1 ml-0 md:ml-60 p-4 md:p-8 max-w-6xl" key={`${tab}-${selectedClientId}`}>
              {tab === "dashboard" && <TrainerDashboard onSelectClient={handleSelectClient} />}
              {tab === "clients" && !selectedClientId && <TrainerClientList onSelectClient={handleSelectClient} />}
              {tab === "clients" && selectedClientId && <TrainerClientDetail clientId={selectedClientId} onBack={handleBackToList} />}
              {tab === "schedule" && <TrainerSchedule />}
              {tab === "messages" && <TrainerMessages />}
              {tab === "exercises" && <TrainerExerciseManager />}
              {tab === "settings" && <TrainerNotificationSettings />}
            </main>
        </div>
      </div>
    </div>
  );
};

export default TrainerView;
