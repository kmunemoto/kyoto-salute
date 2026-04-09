import { useState } from "react";
import { LogOut } from "lucide-react";
import TrainerSidebar from "./TrainerSidebar";
import TrainerDashboard from "./TrainerDashboard";
import TrainerClientList from "./TrainerClientList";
import TrainerClientDetail from "./TrainerClientDetail";
import TrainerSchedule from "./TrainerSchedule";
import TrainerMessages from "./TrainerMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export type TrainerTab = "dashboard" | "clients" | "schedule" | "messages";

const TrainerView = () => {
  const [tab, setTab] = useState<TrainerTab>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const { signOut } = useAuth();

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setTab("clients");
  };

  const handleBackToList = () => {
    setSelectedClientId(null);
  };

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-sm font-bold">パーソナルジム 管理画面</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-1" />
            ログアウト
          </Button>
        </div>
      </div>
      <div className="pt-12">
        <div className="flex">
          <TrainerSidebar activeTab={tab} onTabChange={(t) => { setTab(t); setSelectedClientId(null); }} />
          <main className="flex-1 ml-0 md:ml-60 p-4 md:p-8 max-w-6xl">
            {tab === "dashboard" && <TrainerDashboard onSelectClient={handleSelectClient} />}
            {tab === "clients" && !selectedClientId && <TrainerClientList onSelectClient={handleSelectClient} />}
            {tab === "clients" && selectedClientId && <TrainerClientDetail clientId={selectedClientId} onBack={handleBackToList} />}
            {tab === "schedule" && <TrainerSchedule />}
            {tab === "messages" && <TrainerMessages />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TrainerView;
