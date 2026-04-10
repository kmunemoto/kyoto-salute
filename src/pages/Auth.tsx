import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Dumbbell, Users, Mail, Lock, User, Shield } from "lucide-react";
import GymLogo from "@/components/GymLogo";

type AuthMode = "login" | "signup";
type LoginTarget = "customer" | "trainer";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginTarget, setLoginTarget] = useState<LoginTarget>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordMismatch = mode === "signup" && !isTrainerTarget() && passwordConfirm.length > 0 && password !== passwordConfirm;

  function isTrainerTarget() {
    return loginTarget === "trainer";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !isTrainerTarget() && password !== passwordConfirm) {
      toast.error("パスワードが一致しません");
      return;
    }
    setLoading(true);

    try {
      if (mode === "signup") {
        if (isTrainerTarget()) {
          toast.error("トレーナーアカウントは事前に登録済みです。ログインしてください。");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email,
            },
          },
        });
        if (error) throw error;
        toast.success("アカウントを作成しました！メールを確認してください。");
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
      const msg = err.message || "";
      console.error("Auth error:", msg);
      const jaMessage = 
        msg.includes("Invalid login credentials")
          ? "メールアドレスまたはパスワードが正しくありません。入力内容をご確認ください。"
        : msg.includes("Email not confirmed")
          ? "メールアドレスが未確認です。受信トレイをご確認ください。"
        : msg.includes("User already registered")
          ? "このメールアドレスは既に登録されています。"
        : msg.includes("Password should be at least")
          ? "パスワードは6文字以上で入力してください。"
        : msg.includes("Unable to validate email")
          ? "有効なメールアドレスを入力してください。"
        : msg.includes("Email rate limit exceeded")
          ? "送信回数の上限に達しました。しばらく時間をおいてお試しください。"
        : msg.includes("password") && msg.includes("breach")
          ? "このパスワードは過去に漏洩が確認されています。別のパスワードをお試しください。"
        : `エラーが発生しました: ${msg}`;
      toast.error(jaMessage);
    } finally {
      setLoading(false);
    }
  };

  const isTrainer = loginTarget === "trainer";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-start px-4 py-8 overflow-y-auto">
      <div className="w-full max-w-md space-y-6 slide-up mx-auto my-auto">
        {/* Logo & Title */}
        {/* ⚠️ DO NOT change app name. Keep exactly: "パーソナルジムSalute御所南" */}
        <div className="text-center flex flex-col items-center gap-2">
          <GymLogo size="lg" />
          <h1 className="text-2xl font-black tracking-tight">パーソナルジムSalute御所南</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "アカウントにログイン" : "新規アカウント作成"}
          </p>
        </div>

        {/* Login target tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => { setLoginTarget("customer"); setMode("login"); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              !isTrainer ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            お客様
          </button>
          <button
            type="button"
            onClick={() => { setLoginTarget("trainer"); setMode("login"); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              isTrainer ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            トレーナー
          </button>
        </div>

        <Card className={isTrainer ? "border-primary/30" : ""}>
          <CardContent className="p-6">
            {isTrainer && (
              <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <p className="text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 inline mr-1" />
                  管理者専用ログイン
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display name for customer signup */}
              {mode === "signup" && !isTrainer && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">お名前</label>
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

              {/* Password confirmation for signup */}
              {mode === "signup" && !isTrainer && (
                <div className="space-y-1.5">
                  <label className="text-sm font-bold">パスワード（確認用）</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="6文字以上"
                      minLength={6}
                      className={`w-full bg-secondary rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 transition-all placeholder:text-muted-foreground ${
                        passwordMismatch ? "ring-2 ring-destructive/50 focus:ring-destructive/50" : "focus:ring-accent/30"
                      }`}
                    />
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-destructive font-medium">パスワードが一致しません</p>
                  )}
                </div>
              )}

              <Button type="submit" variant={isTrainer ? "default" : "accent"} className="w-full" disabled={loading || passwordMismatch}>
                {loading ? "処理中..." : mode === "login" ? "ログイン" : "アカウント作成"}
              </Button>
            </form>

            {/* Only customers can sign up */}
            {!isTrainer && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {mode === "login" ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
