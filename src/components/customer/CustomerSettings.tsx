import { useState, useEffect } from "react";
import { Bell, BellOff, Settings, User, Trash2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const CustomerSettings = () => {
  const { profile, loading, refetch } = useProfile();
  const { user, signOut } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile?.display_name]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim() })
      .eq("user_id", user.id);
    if (error) {
      toast.error("プロフィールの更新に失敗しました");
    } else {
      toast.success("プロフィールを更新しました");
      setEditing(false);
      refetch();
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || !confirmed) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_customer_cascade", {
        _customer_id: user.id,
      });
      if (error) throw error;
      toast.success("アカウントを削除しました");
      await signOut();
    } catch (err: any) {
      toast.error(err.message || "アカウントの削除に失敗しました");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  const currentPlan = profile?.plan || "月4回";

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

      {/* Account Deletion */}
      <section className="pt-4">
        <Card className="border-destructive/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              <p className="text-sm font-bold text-destructive">アカウントの削除（退会）</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              退会すると、トレーニング記録・食事データ・予約履歴など、すべてのデータが完全に消去されます。この操作は元に戻すことができません。
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => { setShowDeleteDialog(true); setConfirmed(false); }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              退会する
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">本当に退会しますか？</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                これまでのトレーニング記録や食事データはすべて消去され、<strong>元に戻すことはできません。</strong>
              </p>
              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="confirm-delete"
                  checked={confirmed}
                  onCheckedChange={(v) => setConfirmed(v === true)}
                />
                <label htmlFor="confirm-delete" className="text-sm leading-snug cursor-pointer">
                  上記の内容を理解した上で、退会を希望します
                </label>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>キャンセル</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!confirmed || deleting}
              onClick={handleDeleteAccount}
            >
              {deleting ? "処理中..." : "退会を確定する"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerSettings;
