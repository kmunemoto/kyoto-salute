import { Users, Search, ChevronRight, CheckCircle2, AlertCircle, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { clients, planPrices, clientPaymentStatus, PlanType } from "@/lib/dummyData";

// Dummy: clients with unread messages
const clientsWithUnread: Record<string, number> = { "1": 1, "2": 2 };
import { useState } from "react";

interface TrainerClientListProps {
  onSelectClient: (clientId: string) => void;
}

const TrainerClientList = ({ onSelectClient }: TrainerClientListProps) => {
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<Record<string, boolean>>({ ...clientPaymentStatus });

  const filtered = clients.filter(c =>
    c.name.includes(search) || c.goal.includes(search)
  );

  const formatPrice = (plan: PlanType) => `¥${planPrices[plan].toLocaleString()}`;

  const togglePayment = (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentStatus(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          顧客一覧
        </h1>
        <span className="text-sm text-muted-foreground">{clients.length}名</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="名前・目標で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="card-hover cursor-pointer"
            onClick={() => onSelectClient(c.id)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 relative">
                {c.avatar}
                {clientsWithUnread[c.id] && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                    <MessageCircle className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.plan} · {formatPrice(c.plan)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={c.progress} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-bold text-muted-foreground">{c.progress}%</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div
                  className="flex items-center gap-1.5"
                  onClick={(e) => togglePayment(c.id, e)}
                >
                  {paymentStatus[c.id] ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      支払済
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                      <AlertCircle className="w-3.5 h-3.5" />
                      未払い
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TrainerClientList;