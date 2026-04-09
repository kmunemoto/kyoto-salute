import { Users, Search, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { clients } from "@/lib/dummyData";
import { useState } from "react";

interface TrainerClientListProps {
  onSelectClient: (clientId: string) => void;
}

const TrainerClientList = ({ onSelectClient }: TrainerClientListProps) => {
  const [search, setSearch] = useState("");

  const filtered = clients.filter(c =>
    c.name.includes(search) || c.goal.includes(search)
  );

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
              <div className="w-11 h-11 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {c.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.goal} · {c.totalSessions}回</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={c.progress} className="h-1.5 flex-1" />
                  <span className="text-[10px] font-bold text-muted-foreground">{c.progress}%</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-xs font-medium">次回 {c.nextSession}</p>
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
