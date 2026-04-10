import { useState } from "react";
import { Bell, BellRing, Settings, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const TrainerNotificationSettings = () => {
  const [messageNotif, setMessageNotif] = useState(true);
  const [reminderNotif, setReminderNotif] = useState(true);
  const { isSupported, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushSubscription();

  const handleTogglePush = async () => {
    if (isSubscribed) {
      const ok = await unsubscribe();
      if (ok) toast.success("プッシュ通知を無効にしました");
      else toast.error("通知の解除に失敗しました");
    } else {
      const ok = await subscribe();
      if (ok) toast.success("プッシュ通知を有効にしました！");
      else toast.error("通知の許可が得られませんでした。ブラウザの設定を確認してください。");
    }
  };

  return (
    <div className="pb-20 md:pb-0">
      <h1 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-accent" />
        通知設定
      </h1>

      <div className="space-y-4 max-w-lg">
        {/* Browser push notification */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">プッシュ通知</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  アプリを開いていない時でも、新着メッセージや予約の通知をスマートフォンに届けます。
                </p>
                {!isSupported ? (
                  <p className="text-xs text-muted-foreground">このブラウザはプッシュ通知に対応していません。</p>
                ) : isSubscribed ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400">
                      <BellRing className="w-4 h-4" />
                      プッシュ通知は有効です
                    </div>
                    <Button size="sm" variant="outline" onClick={handleTogglePush} disabled={pushLoading}>
                      通知を無効にする
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={handleTogglePush} disabled={pushLoading}>
                    <Bell className="w-4 h-4 mr-1.5" />
                    プッシュ通知を許可する
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Message notification toggle */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">新着メッセージ通知</h3>
                  <p className="text-xs text-muted-foreground">顧客からメッセージが届いた際に通知</p>
                </div>
              </div>
              <Switch checked={messageNotif} onCheckedChange={setMessageNotif} />
            </div>
          </CardContent>
        </Card>

        {/* Reminder notification toggle */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">予約リマインド通知</h3>
                  <p className="text-xs text-muted-foreground">予約24時間前の自動リマインド送信状況</p>
                </div>
              </div>
              <Switch checked={reminderNotif} onCheckedChange={setReminderNotif} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrainerNotificationSettings;
