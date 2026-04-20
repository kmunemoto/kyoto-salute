import { useEffect } from "react";
import LegalLayout from "@/components/legal/LegalLayout";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-3 text-foreground">{children}</h2>
);
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base sm:text-lg font-semibold mt-6 mb-2 text-foreground">{children}</h3>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-foreground/85 leading-7">{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-6 space-y-1.5 text-foreground/85 leading-7">{children}</ul>
);

const Privacy = () => {
  useEffect(() => {
    document.title = "プライバシーポリシー | パーソナルジムSalute御所南";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "パーソナルジムSalute御所南が運営するkyoto-saluteアプリのプライバシーポリシー。お客様の個人情報の取り扱いについて記載しています。";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <LegalLayout title="プライバシーポリシー">
      <H2>1. はじめに</H2>
      <P>
        パーソナルジムSalute御所南（以下「当ジム」）が提供するkyoto-saluteアプリ（以下「本アプリ」）は、お客様の個人情報を適切に保護することを重要な責務と考えています。本ポリシーでは、本アプリで取得する情報の内容および利用方法について定めます。
      </P>

      <H2>2. 取得する情報</H2>
      <UL>
        <li><strong>基本情報：</strong>氏名、メールアドレス、電話番号、生年月日、性別</li>
        <li><strong>身体情報：</strong>身長、体重、体脂肪率、トレーニング記録</li>
        <li><strong>健康情報：</strong>既往歴、アレルギー、服用中の薬、運動習慣（カウンセリングシートで取得）</li>
        <li><strong>画像データ：</strong>AI骨格診断用の姿勢写真、AI食事管理用の食事写真</li>
        <li><strong>予約情報：</strong>予約日時、キャンセル履歴</li>
        <li><strong>Google連携情報：</strong>Googleカレンダーへの予約情報同期（ユーザーが許可した場合）</li>
        <li><strong>LINE連携情報：</strong>LINEユーザーID（LINE通知を希望する場合）</li>
      </UL>

      <H2>3. 利用目的</H2>
      <UL>
        <li>予約管理、トレーニング記録の管理</li>
        <li>AI骨格診断、AI食事管理、月間レポート生成</li>
        <li>LINE通知、Googleカレンダー連携</li>
        <li>お客様へのサービス提供・改善</li>
      </UL>

      <H2>4. 第三者への提供</H2>
      <P>
        法令に基づく場合を除き、お客様の同意なく第三者に個人情報を提供することはありません。
      </P>
      <P>
        Google API、LINE Messaging API、OpenAI API等、サービス提供に必要な外部サービスへのデータ連携は、各サービスのプライバシーポリシーに従います。
      </P>

      <H2>5. Google API利用について</H2>
      <P>
        本アプリがGoogle APIから取得した情報の使用および他のアプリへの転送は、
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent/80"
        >
          Google APIサービス利用者データポリシー
        </a>
        （限定使用要件を含む）に準拠します。
      </P>

      <H2>6. データの保管・セキュリティ</H2>
      <UL>
        <li>データはSupabaseのセキュアなサーバーに暗号化して保存されます</li>
        <li>定期的なセキュリティ対策を実施しています</li>
        <li>退会後はお客様のデータを速やかに削除いたします</li>
      </UL>

      <H2>7. お客様の権利</H2>
      <UL>
        <li>ご自身の個人情報の開示、訂正、削除を請求する権利があります</li>
        <li>請求は下記お問い合わせ先までご連絡ください</li>
      </UL>

      <H2>8. Cookieおよび類似技術</H2>
      <P>
        本アプリではサービス提供のためCookieを使用する場合があります。ブラウザの設定で無効化できますが、一部機能が利用できなくなる可能性があります。
      </P>

      <H2>9. 未成年の方について</H2>
      <P>18歳未満の方が本アプリを利用する場合は、保護者の同意が必要です。</P>

      <H2>10. プライバシーポリシーの変更</H2>
      <P>
        本ポリシーは必要に応じて改定される場合があります。重要な変更がある場合はアプリ内で通知いたします。
      </P>

      <H2>11. お問い合わせ</H2>
      <div className="rounded-xl bg-secondary/60 border border-border/60 p-4 sm:p-5 not-prose">
        <p className="font-bold mb-1">パーソナルジムSalute御所南</p>
        <p className="text-sm text-foreground/80">所在地：京都府京都市中京区</p>
        <p className="text-sm text-foreground/80">
          メール：
          <a href="mailto:munekan2989@gmail.com" className="text-accent underline underline-offset-2 hover:text-accent/80">
            munekan2989@gmail.com
          </a>
        </p>
      </div>
    </LegalLayout>
  );
};

export default Privacy;