import { useState } from "react";
import { Bell, BellOff, Settings, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { currentPlan } from "@/lib/dummyData";

const CustomerSettings = () => {
  const [reminderEnabled, setReminderEnabled] = useState(true);

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      <h1 className="text-lg font-bold flex items-center gap-2">
        <Settings className="w-5 h-5" />
        設定
      </h1>

      {/* Profile */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          プロフィール
        </h2>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">名前</span>
              <span className="text-sm font-bold">田中 太郎</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">プラン</span>
              <span className="text-sm font-bold">{currentPlan}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Notification Settings */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          通知設定
        </h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {reminderEnabled ? (
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-accent" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                    <BellOff className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">予約リマインド通知</p>
                  <p className="text-[11px] text-muted-foreground">予約の24時間前にお知らせが届きます</p>
                </div>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>
            {reminderEnabled && (
              <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
                <p className="text-xs text-muted-foreground">
                  ✅ リマインド通知は<span className="font-bold text-foreground">オン</span>です。予約日の前日に「明日〇〇時からトレーニングの予約が入っています」という通知が届きます。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CustomerSettings;
