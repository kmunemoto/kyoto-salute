import { useState } from "react";
import TrainerSidebar from "./TrainerSidebar";
import TrainerDashboard from "./TrainerDashboard";
import TrainerClientList from "./TrainerClientList";
import TrainerClientDetail from "./TrainerClientDetail";
import TrainerSchedule from "./TrainerSchedule";
import TrainerMessages from "./TrainerMessages";

export type TrainerTab = "dashboard" | "clients" | "schedule" | "messages";

const TrainerView = () => {
  const [tab, setTab] = useState<TrainerTab>("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setTab("clients");
  };

  const handleBackToList = () => {
    setSelectedClientId(null);
  };

  return (
    <div className="min-h-screen bg-background pt-14 fade-in">
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
  );
};

export default TrainerView;
