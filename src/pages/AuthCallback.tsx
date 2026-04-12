import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the auth callback - exchange code for session or process hash tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);

        // PKCE flow: exchange code for session
        const code = queryParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Code exchange error:", error.message);
          }
          navigate("/", { replace: true });
          return;
        }

        // Implicit flow: tokens in hash
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          // Supabase client will pick up tokens from the URL automatically
          // Just wait briefly for the auth state to update
          await new Promise((resolve) => setTimeout(resolve, 500));
          navigate("/", { replace: true });
          return;
        }

        // Handle error in URL
        const error = hashParams.get("error_description") || queryParams.get("error_description");
        if (error) {
          console.error("Auth callback error:", error);
        }

        navigate("/auth", { replace: true });
      } catch (err) {
        console.error("Auth callback failed:", err);
        navigate("/auth", { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
        <p className="text-sm text-muted-foreground">認証処理中...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
