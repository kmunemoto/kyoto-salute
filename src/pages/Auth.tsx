import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Dumbbell, Users, Mail, Lock, User, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "signup";
type RoleChoice = "customer" | "trainer" | null;

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [roleChoice, setRoleChoice] = useState<RoleChoice>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!roleChoice) {
          toast.error("アカウントの種類を選択してください");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email,
              role: roleChoice,
            },
          },
        });
        if (error) throw error;
        toast.success("アカウントを作成しました！");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("ログインしました！");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 slide-up">
        {/* Logo */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl gym-gradient flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">パーソナルジム</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "アカウントにログイン" : "新規アカウント作成"}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role selection for signup */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <label className="text-sm font-bold">アカウントの種類</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRoleChoice("customer")}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        roleChoice === "customer"
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <Dumbbell className={`w-6 h-6 mx-auto mb-2 ${roleChoice === "customer" ? "text-accent" : "text-muted-foreground"}`} />
                      <p className="text-sm font-bold">お客様</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">トレーニング記録を確認</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleChoice("trainer")}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        roleChoice === "trainer"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Users className={`w-6 h-6 mx-auto mb-2 ${roleChoice === "trainer" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-bold">トレーナー</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">顧客を管理</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Display name for signup */}
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">表示名</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="お名前"
                      className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold">メールアドレス</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@example.com"
                    className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold">パスワード</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上"
                    minLength={6}
                    className="w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <Button type="submit" variant="accent" className="w-full" disabled={loading}>
                {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウント作成"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === "login" ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
