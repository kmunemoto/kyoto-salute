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
import TrainerGymSettings from "./TrainerGymSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import GymLogo from "@/components/GymLogo";
import { useUnreadCount } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";

export type TrainerTab = "dashboard" | "clients" | "schedule" | "messages" | "settings" | "exercises" | "gym-settings";

const TrainerView = () => {
  const [tab, setTab] = useState<TrainerTab>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { signOut } = useAuth();
  const { user } = useAuth();
  const { count: unreadMessages, refetch: refetchUnread } = useUnreadCount();

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setTab("clients");
  };

  const handleBackToList = () => {
    setSelectedClientId(null);
  };

  // Realtime toast for incoming messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("trainer-msg-toast")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as { sender_id: string; receiver_id: string; content: string };
          if (msg.receiver_id === user.id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name")
              .eq("user_id", msg.sender_id)
              .single();
            const name = profile?.display_name || "顧客";
            toast(`${name} 様から新着メッセージがあります`, {
              description: `「${msg.content.substring(0, 30)}${msg.content.length > 30 ? "…" : ""}」`,
              action: {
                label: "確認する",
                onClick: () => setTab("messages"),
              },
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Refetch unread when leaving messages tab
  useEffect(() => {
    if (tab !== "messages") {
      refetchUnread();
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-background fade-in overflow-x-hidden">
      {/* Header — アプリ名は「パーソナルジムSalute御所南」で固定。絶対にカタカナに変更しないこと！ */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <GymLogo size="sm" />
            <span className="text-xs sm:text-sm font-bold truncate">パーソナルジムSalute御所南 <span className="hidden sm:inline">管理画面</span></span>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={() => setTab("settings")} className="text-muted-foreground h-9 w-9 p-0 sm:h-auto sm:w-auto sm:p-2">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground h-9 px-2 sm:px-3">
              <LogOut className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">ログアウト</span>
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
          <main className="flex-1 ml-0 md:ml-60 p-3 sm:p-4 md:p-8 max-w-6xl" key={`${tab}-${selectedClientId}`}>
              {tab === "dashboard" && <TrainerDashboard onSelectClient={handleSelectClient} />}
              {tab === "clients" && !selectedClientId && <TrainerClientList onSelectClient={handleSelectClient} />}
              {tab === "clients" && selectedClientId && <TrainerClientDetail clientId={selectedClientId} onBack={handleBackToList} />}
              {tab === "schedule" && <TrainerSchedule />}
              {tab === "messages" && <TrainerMessages />}
              {tab === "exercises" && <TrainerExerciseManager />}
              {tab === "gym-settings" && <TrainerGymSettings />}
              {tab === "settings" && <TrainerNotificationSettings />}
            </main>
        </div>
      </div>
    </div>
  );
};

export default TrainerView;
