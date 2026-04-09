import { useState, useEffect } from "react";
import { X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const PWA_DISMISSED_KEY = "pwa-install-dismissed";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as any).standalone === true;

const PwaInstallBanner = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(PWA_DISMISSED_KEY)) return;

    // Android Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show manual instructions after short delay
    if (isIOS()) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    dismiss();
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(PWA_DISMISSED_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-2 right-2 z-[100] max-w-lg mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-2xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <img src="/icon-192.png" alt="Salute" className="w-12 h-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">ホーム画面に追加</p>
            {isIOS() ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                画面下の <Share className="w-3.5 h-3.5 inline -mt-0.5" /> 共有ボタンをタップし、
                「<strong>ホーム画面に追加</strong> <Plus className="w-3 h-3 inline -mt-0.5" />」を選択してください
              </p>
            ) : isAndroid() ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                アプリのようにすぐ起動できます
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                アプリのようにすぐ起動できます
              </p>
            )}
          </div>
          <button onClick={dismiss} className="text-muted-foreground p-1 -mr-1 -mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isIOS() && (
          <Button variant="accent" size="sm" className="w-full mt-3" onClick={handleInstall}>
            インストール
          </Button>
        )}
      </div>
    </div>
  );
};

export default PwaInstallBanner;
