import { useState } from "react";
import { LogOut } from "lucide-react";

import BottomNav from "./BottomNav";
import CustomerHome from "./CustomerHome";
import CustomerBooking from "./CustomerBooking";
import CustomerMeals from "./CustomerMeals";
import CustomerChat from "./CustomerChat";
import CustomerTraining from "./CustomerTraining";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export type CustomerTab = "home" | "booking" | "training" | "meals" | "chat";

const CustomerView = () => {
  const [tab, setTab] = useState<CustomerTab>("home");
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto fade-in">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground">LOGO</div>
            {/* ⚠️ DO NOT change this app name. Keep exactly as-is: "パーソナルジムSalute御所南" — never convert "Salute" to katakana */}
            <span className="text-sm font-bold">パーソナルジムSalute御所南</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="pt-12">
        {tab === "home" && <CustomerHome />}
        {tab === "booking" && <CustomerBooking />}
        {tab === "training" && <CustomerTraining />}
        {tab === "meals" && <CustomerMeals />}
        {tab === "chat" && <CustomerChat />}
      </div>
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
};

export default CustomerView;
