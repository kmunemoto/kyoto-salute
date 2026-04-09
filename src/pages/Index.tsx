import { useState } from "react";
import ModeToggle from "@/components/ModeToggle";
import CustomerView from "@/components/customer/CustomerView";
import TrainerView from "@/components/trainer/TrainerView";

const Index = () => {
  const [mode, setMode] = useState<"customer" | "trainer">("customer");

  return (
    <>
      <ModeToggle mode={mode} onToggle={setMode} />
      {mode === "customer" ? <CustomerView /> : <TrainerView />}
    </>
  );
};

export default Index;
