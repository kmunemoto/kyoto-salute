import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

import BottomNav from "./BottomNav";
import CustomerHome from "./CustomerHome";
import CustomerBooking from "./CustomerBooking";
import CustomerMeals from "./CustomerMeals";
import CustomerChat from "./CustomerChat";
import CustomerTraining from "./CustomerTraining";
import CustomerSettings from "./CustomerSettings";
import CustomerPosture from "./CustomerPosture";
import PwaInstallBanner from "./PwaInstallBanner";
import { Button } from "@/components/ui/button";
import GymLogo from "@/components/GymLogo";
import { useUnreadCount } from "@/hooks/useMessages";

export type CustomerTab = "home" | "booking" | "training" | "meals" | "chat" | "settings" | "posture";

const CustomerView = () => {
  const [tab, setTab] = useState<CustomerTab>("home");
  const { count: unreadChat, refetch: refetchUnread } = useUnreadCount();

  // Refetch unread when leaving chat
  useEffect(() => {
    if (tab !== "chat") {
      refetchUnread();
    }
  }, [tab]);

  return (
    <div className="min-h-screen bg-background pb-20 w-full max-w-md mx-auto overflow-x-hidden fade-in" translate="no">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <GymLogo size="sm" />
            {/* ⚠️ DO NOT change this app name. Keep exactly as-is: "パーソナルジムSalute御所南" — never convert "Salute" to katakana */}
            <span className="text-sm font-bold">パーソナルジムSalute御所南</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setTab("chat")} className="text-muted-foreground relative">
            <MessageCircle className="w-4 h-4" />
            {unreadChat > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                {unreadChat}
              </span>
            )}
          </Button>
        </div>
      </div>
      <div className="pt-12" key={tab}>
        {tab === "home" && <CustomerHome />}
        {tab === "booking" && <CustomerBooking />}
        {tab === "training" && <CustomerTraining />}
        {tab === "meals" && <CustomerMeals />}
        {tab === "chat" && <CustomerChat />}
        {tab === "settings" && <CustomerSettings />}
        {tab === "posture" && <CustomerPosture />}
      </div>
      <BottomNav activeTab={tab} onTabChange={setTab} unreadChat={unreadChat} />
      <PwaInstallBanner />
    </div>
  );
};

export default CustomerView;
