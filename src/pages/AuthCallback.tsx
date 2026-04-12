import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        // PKCE flow: exchange code for session
        const code = queryParams.get("code");
        if (code) {
          console.log("[AuthCallback] Exchanging code for session...");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("[AuthCallback] Code exchange error:", error.message);
          } else {
            console.log("[AuthCallback] Code exchange successful");
          }
          // Force hard navigation to ensure fresh state
          window.location.replace("/");
          return;
        }

        // Implicit flow: tokens in hash
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          console.log("[AuthCallback] Access token found in hash, waiting for session...");
          // Wait for Supabase client to pick up the tokens
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error("[AuthCallback] Session error:", error.message);
          } else if (data.session) {
            console.log("[AuthCallback] Session established");
          }
          window.location.replace("/");
          return;
        }

        // Handle error in URL
        const error =
          hashParams.get("error_description") ||
          queryParams.get("error_description");
        if (error) {
          console.error("[AuthCallback] Auth error:", error);
        }

        // No code or token found - redirect to auth
        console.warn("[AuthCallback] No code or token found, redirecting to /auth");
        window.location.replace("/auth");
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        window.location.replace("/auth");
      }
    };

    handleCallback();
  }, []);

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
