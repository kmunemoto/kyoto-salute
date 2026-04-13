import { useState, useEffect, useMemo } from "react";
import { Settings, User, Pencil, MessageCircle, CheckCircle2, Unlink, LogOut, Loader2, Calendar, History, Clock, Dumbbell, Award, Bone, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings, BookingWithTime } from "@/hooks/useBookings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import DiagnosisHistorySection from "./posture/DiagnosisHistorySection";

const PLAN_LABELS: Record<string, string> = {
  "初回無料体験": "初回無料体験",
  "月4回": "月4回プラン",
  "月6回": "月6回プラン",
  "月8回": "月8回プラン",
  "通い放題": "通い放題プラン",
  "通常": "通常",
};

const CustomerSettings = () => {
  const { profile, loading, updateDisplayName, refetch } = useProfile();
  const { user, signOut } = useAuth();
  const { bookings: myBookings, loading: bookingsLoading } = useMyBookings();
  
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Google Calendar state
  const [gcalLinked, setGcalLinked] = useState(false);
  const [gcalLoading, setGcalLoading] = useState(true);

  const isLineLinked = !!profile?.line_user_id;




  useEffect(() => {
    setDisplayName(profile?.display_name || "");
  }, [profile?.display_name]);

  // Check Google Calendar link status
  useEffect(() => {
    if (!user) return;
    (async () => {
      setGcalLoading(true);
      const { data } = await supabase
        .from("google_calendar_tokens" as any)
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      setGcalLinked(!!data);
      setGcalLoading(false);
    })();
  }, [user]);

  // Listen for LINE link callback & Google Calendar callback
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
      if (e.data?.type === "google-calendar-result") {
        if (e.data.success) {
          toast.success("Googleカレンダー連携が完了しました！");
          setGcalLinked(true);
        } else {
          toast.error("Googleカレンダー連携に失敗しました");
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

  const handleGcalLink = async () => {
    if (!user) return;
    const popup = window.open("", "gcal-link", "width=500,height=700");
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-auth-url", {
        body: { user_id: user.id },
      });
      if (error || !data?.url) {
        popup?.close();
        toast.error("認証URLの取得に失敗しました");
        return;
      }
      if (popup) popup.location.href = data.url;
    } catch {
      popup?.close();
      toast.error("エラーが発生しました");
    }
  };

  const handleGcalUnlink = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("google_calendar_tokens" as any)
      .delete()
      .eq("user_id", user.id);
    if (error) {
      toast.error("連携の解除に失敗しました");
    } else {
      toast.success("Googleカレンダー連携を解除しました");
      setGcalLinked(false);
    }
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

      {/* Googleカレンダー連携 */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Googleカレンダー連携
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${gcalLinked ? "bg-blue-500/10" : "bg-muted"}`}>
                <Calendar className={`w-4 h-4 ${gcalLinked ? "text-blue-500" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Googleカレンダー</p>
                <p className="text-[11px] text-muted-foreground mb-2">
                  連携すると、予約がGoogleカレンダーに自動で追加されます
                </p>
                {gcalLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : gcalLinked ? (
                  <div className="space-y-2">
                    <div className="bg-blue-500/5 rounded-lg p-2 border border-blue-500/20">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        Googleカレンダー連携済み
                      </p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleGcalUnlink} className="text-xs h-7">
                      <Unlink className="w-3 h-3 mr-1" />
                      連携を解除
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleGcalLink}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Googleカレンダーと連携する
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Appleカレンダー連携 */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5" />
          Appleカレンダー連携
        </h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-muted">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">Appleカレンダー連携</p>
                <p className="text-[11px] text-muted-foreground mb-2">
                  一度連携すると、今後の予約がiPhoneの純正カレンダーに自動反映されます
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    try {
                      if (!profile?.calendar_token) {
                        toast.error("カレンダートークンが見つかりません。ページを再読み込みしてください。");
                        return;
                      }
                      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                      if (!supabaseUrl) {
                        toast.error("カレンダー連携に失敗しました");
                        return;
                      }
                      const httpsUrl = `${supabaseUrl}/functions/v1/calendar-feed?token=${profile.calendar_token}`;
                      const webcalUrl = httpsUrl.replace(/^https:\/\//, "webcal://");
                      window.location.href = webcalUrl;
                      toast.success("カレンダー購読画面が表示されます");
                    } catch (err) {
                      console.error("Calendar link error:", err);
                      toast.error("カレンダー連携に失敗しました");
                    }
                  }}
                  className="text-xs"
                  variant="outline"
                >
                  <Smartphone className="w-3.5 h-3.5 mr-1" />
                  Appleカレンダーと連携する
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          過去の受講履歴
        </h2>

        {bookingsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (() => {
          const now = new Date();
          const pastBookings = myBookings
            .filter((b) => {
              if (b.status === "キャンセル済み") return false;
              const endDt = new Date(`${b.date}T${b.endTime}:00+09:00`);
              return endDt <= now;
            })
            .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

          // Compute cycle-based count
          const cycleStart = profile?.cycle_start_date ? new Date(profile.cycle_start_date) : null;
          const cycleEnd = cycleStart ? new Date(new Date(cycleStart).setMonth(cycleStart.getMonth() + 1)) : null;
          const cycleCount = cycleStart && cycleEnd
            ? pastBookings.filter((b) => {
                const d = new Date(b.date);
                return d >= cycleStart && d < cycleEnd;
              }).length
            : pastBookings.length;

          const planMax: Record<string, number> = { "月4回": 4, "月6回": 6, "月8回": 8 };
          const maxSessions = profile?.plan ? planMax[profile.plan] : null;
          const isUnlimited = profile?.plan === "通い放題";

          return (
            <>
              {/* Summary card */}
              <Card className="mb-3 border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">今回の受講回数</p>
                    {maxSessions ? (
                      <p className="text-2xl font-extrabold tracking-tight">
                        <span className="text-accent">{cycleCount}</span>
                        <span className="text-base font-bold text-muted-foreground"> / {maxSessions} 回</span>
                      </p>
                    ) : isUnlimited ? (
                      <p className="text-2xl font-extrabold tracking-tight">
                        <span className="text-accent">{cycleCount}</span>
                        <span className="text-base font-bold text-muted-foreground"> 回</span>
                      </p>
                    ) : (
                      <p className="text-2xl font-extrabold tracking-tight">
                        <span className="text-accent">{pastBookings.length}</span>
                        <span className="text-base font-bold text-muted-foreground"> 回</span>
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">まだ受講履歴はありません</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {pastBookings.map((b) => {
                    const dt = new Date(`${b.date}T${b.startTime}:00+09:00`);
                    const dateLabel = format(dt, "M月d日（E）", { locale: ja });
                    const planLabel = PLAN_LABELS[b.booking_type] || b.booking_type;
                    return (
                      <Card key={b.id} className="opacity-75">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Dumbbell className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">{dateLabel}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {b.startTime}〜{b.endTime}
                              </span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {planLabel}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </section>

      {/* 骨格診断履歴 */}
      <DiagnosisHistorySection userId={user?.id} />

      {/* Logout */}
      <section className="pt-2">
        <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          ログアウト
        </Button>
      </section>
    </div>
  );
};

export default CustomerSettings;
