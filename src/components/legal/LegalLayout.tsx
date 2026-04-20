import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import GymLogo from "@/components/GymLogo";

interface LegalLayoutProps {
  title: string;
  children: React.ReactNode;
}

const BackLink = () => (
  <Link
    to="/"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
  >
    <ArrowLeft className="w-4 h-4" />
    アプリに戻る
  </Link>
);

const LegalLayout = ({ title, children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground" translate="no">
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <GymLogo size="sm" />
            <span className="text-sm sm:text-base font-bold truncate">パーソナルジムSalute御所南</span>
          </Link>
          <BackLink />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-8 pb-4 border-b border-border">
          {title}
        </h1>

        <article className="prose-legal space-y-6 leading-relaxed text-[15px] sm:text-base">
          {children}
        </article>

        <div className="mt-12 pt-6 border-t border-border space-y-2 text-sm text-muted-foreground">
          <p>制定日：2026年4月20日</p>
          <p>最終更新日：2026年4月20日</p>
        </div>

        <div className="mt-8 flex justify-center">
          <BackLink />
        </div>
      </main>

      <footer className="border-t border-border/60 mt-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-muted-foreground space-x-4">
          <Link to="/privacy" className="hover:text-foreground transition-colors">プライバシーポリシー</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
        </div>
      </footer>
    </div>
  );
};

export default LegalLayout;