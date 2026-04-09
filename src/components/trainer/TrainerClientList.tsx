import { Users, Search, ChevronRight, CheckCircle2, AlertCircle, MessageCircle, Sparkles, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { planPrices, PlanType } from "@/lib/dummyData";
import { useAllCustomerProfiles } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TrainerClientListProps {
  onSelectClient: (clientId: string) => void;
}

const TrainerClientList = ({ onSelectClient }: TrainerClientListProps) => {
  const { profiles, loading, setProfiles } = useAllCustomerProfiles();
  const [search, setSearch] = useState("");

  const filtered = profiles.filter(c =>
    (c.display_name || "").includes(search) || c.plan.includes(search)
  );

  const formatPrice = (plan: string) => {
    const p = planPrices[plan as PlanType];
    return p ? `¥${p.toLocaleString()}` : "";
  };

  const togglePayment = async (userId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from("profiles")
      .update({ paid_this_month: newStatus })
      .eq("user_id", userId);

    if (error) {
      toast.error("更新に失敗しました");
      return;
    }

    setProfiles(prev => prev.map(p =>
      p.user_id === userId ? { ...p, paid_this_month: newStatus } : p
    ));
    toast.success(newStatus ? "支払済みに更新しました" : "未払いに更新しました");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-accent" />
          顧客一覧
        </h1>
        <span className="text-sm text-muted-foreground">{profiles.length}名</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="名前・プランで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">まだ顧客が登録されていません</p>
            <p className="text-xs mt-1">顧客がアカウントを作成すると、ここに表示されます</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const initial = (c.display_name || "?")[0];
            return (
              <Card
                key={c.user_id}
                className="card-hover cursor-pointer"
                onClick={() => onSelectClient(c.user_id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 relative">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{c.display_name || "名前未設定"}</p>
                    <p className="text-xs text-muted-foreground">{c.plan} · {formatPrice(c.plan)}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {c.trial_completed ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                          <UserCheck className="w-2.5 h-2.5" />
                          既存顧客
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-accent text-accent-foreground">
                          <Sparkles className="w-2.5 h-2.5" />
                          初回体験
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div
                      className="flex items-center gap-1.5 cursor-pointer"
                      onClick={(e) => togglePayment(c.user_id, c.paid_this_month, e)}
                    >
                      {c.paid_this_month ? (
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TrainerClientList;
