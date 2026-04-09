import { useState } from "react";
import BottomNav from "./BottomNav";
import CustomerHome from "./CustomerHome";
import CustomerBooking from "./CustomerBooking";
import CustomerMeals from "./CustomerMeals";
import CustomerChat from "./CustomerChat";

export type CustomerTab = "home" | "booking" | "meals" | "chat";

const CustomerView = () => {
  const [tab, setTab] = useState<CustomerTab>("home");

  return (
    <div className="min-h-screen bg-background pt-14 pb-20 max-w-lg mx-auto fade-in">
      {tab === "home" && <CustomerHome />}
      {tab === "booking" && <CustomerBooking />}
      {tab === "meals" && <CustomerMeals />}
      {tab === "chat" && <CustomerChat />}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
};

export default CustomerView;
