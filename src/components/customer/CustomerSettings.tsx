import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Settings, User, Pencil, Shield, MessageCircle, CheckCircle2, Unlink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const CustomerSettings = () => {
  const { profile, loading, updateDisplayName, refetch } = useProfile();
  const { user } = useAuth();
  const { isSupported, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushSubscription();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const isLineLinked = !!profile?.line_user_id;

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

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
  }, [profile?.display_name]);

  // Listen for LINE link callback
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "line-link-result") {
        if (e.data.success) {
          toast.success("LINE連携が完了しました！");
          refetch();
        } else {
          toast.error("LINE連携に失敗しました");
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [refetch]);

  const handleLineLink = () => {
    if (!user) return;
    const channelId = "2009770713";
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const redirectUri = encodeURIComponent(`${supabaseUrl}/functions/v1/line-login-callback`);
    const lineAuthUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${channelId}&redirect_uri=${redirectUri}&state=${user.id}&scope=profile%20openid`;
    window.open(lineAuthUrl, "line-link", "width=500,height=700");
  };

  const handleLineUnlink = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ line_user_id: null })
      .eq("user_id", user.id);
    if (error) {
      toast.error("LINE連携の解除に失敗しました");
    } else {
      toast.success("LINE連携を解除しました");
      refetch();
    }
  };

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    const { error } = await updateDisplayName(displayName);
    if (error) {
      toast.error("保存に失敗しました");
    } else {
      toast.success("プロフィールを更新しました");
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  const currentPlan = profile?.plan || "未設定";

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
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">名前</span>
              {editing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8 w-40 text-sm"
                    placeholder="名前を入力"
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={saving || !displayName.trim()} className="h-8 text-xs">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "保存"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDisplayName(profile?.display_name || ""); }} className="h-8 text-xs">
                    取消
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{profile?.display_name || "ゲスト"}</span>
                  <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-muted transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">プラン</span>
              <span className="text-sm font-bold">{currentPlan}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* LINE連携 */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" />
          LINE連携
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isLineLinked ? "bg-[#06C755]/10" : "bg-muted"}`}>
                <MessageCircle className={`w-4 h-4 ${isLineLinked ? "text-[#06C755]" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">LINE通知</p>
                <p className="text-[11px] text-muted-foreground mb-2">
                  LINEアカウントと連携すると、予約確認やリマインド通知がLINEに届きます
                </p>
                {isLineLinked ? (
                  <div className="space-y-2">
                    <div className="bg-[#06C755]/5 rounded-lg p-2 border border-[#06C755]/20">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#06C755]" />
                        LINE連携済み
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleLineUnlink} className="text-xs h-7">
                      <Unlink className="w-3 h-3 mr-1" />
                      連携を解除
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleLineLink}
                    className="text-xs bg-[#06C755] hover:bg-[#06C755]/90 text-white"
                  >
                    <MessageCircle className="w-3.5 h-3.5 mr-1" />
                    LINEと連携する
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Push Notification */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          プッシュ通知
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <BellRing className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">スマートフォン通知</p>
                <p className="text-[11px] text-muted-foreground mb-2">アプリを閉じていても予約やメッセージの通知が届きます</p>
                {!isSupported ? (
                  <p className="text-[11px] text-muted-foreground">このブラウザはプッシュ通知に対応していません。</p>
                ) : isSubscribed ? (
                  <div className="space-y-2">
                    <div className="bg-accent/5 rounded-lg p-2 border border-accent/20">
                      <p className="text-xs text-muted-foreground">✅ プッシュ通知は<span className="font-bold text-foreground">オン</span>です</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleTogglePush} disabled={pushLoading} className="text-xs h-7">
                      通知を無効にする
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={handleTogglePush} disabled={pushLoading} className="text-xs">
                    <Bell className="w-3.5 h-3.5 mr-1" />
                    プッシュ通知を許可する
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Reminder Notification Settings */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" />
          リマインド通知
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
              <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
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
