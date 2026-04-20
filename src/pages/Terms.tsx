import { useEffect } from "react";
import LegalLayout from "@/components/legal/LegalLayout";

const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl sm:text-2xl font-bold mt-10 mb-3 text-foreground">{children}</h2>
);
const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-foreground/85 leading-7">{children}</p>
);
const UL = ({ children }: { children: React.ReactNode }) => (
  <ul className="list-disc pl-6 space-y-1.5 text-foreground/85 leading-7">{children}</ul>
);

const Terms = () => {
  useEffect(() => {
    document.title = "利用規約 | パーソナルジムSalute御所南";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "パーソナルジムSalute御所南が運営するkyoto-saluteアプリの利用規約。サービスの利用条件について記載しています。";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <LegalLayout title="利用規約">
      <H2>第1条（適用）</H2>
      <P>
        本規約は、パーソナルジムSalute御所南（以下「当ジム」）がkyoto-saluteアプリ（以下「本アプリ」）において提供するサービス（以下「本サービス」）の利用に関する条件を定めるものです。
      </P>

      <H2>第2条（利用登録）</H2>
      <UL>
        <li>本サービスは当ジムのお客様のみが利用できます</li>
        <li>虚偽の情報を登録した場合、利用を制限する場合があります</li>
      </UL>

      <H2>第3条（禁止事項）</H2>
      <P>以下の行為を禁止します：</P>
      <UL>
        <li>法令または公序良俗に違反する行為</li>
        <li>犯罪行為に関連する行為</li>
        <li>本アプリの運営を妨害する行為</li>
        <li>他のユーザーに迷惑をかける行為</li>
        <li>当ジムのサーバーに過度な負荷をかける行為</li>
        <li>他者のアカウントを不正に利用する行為</li>
        <li>その他当ジムが不適切と判断する行為</li>
      </UL>

      <H2>第4条（本サービスの提供の停止等）</H2>
      <P>以下の場合、事前通知なしにサービスを停止することがあります：</P>
      <UL>
        <li>システムメンテナンス</li>
        <li>地震、停電、天災等の不可抗力</li>
        <li>その他運営上やむを得ない場合</li>
      </UL>

      <H2>第5条（利用制限）</H2>
      <P>禁止事項に違反した場合、アカウントの利用を制限または削除する場合があります。</P>

      <H2>第6条（免責事項）</H2>
      <UL>
        <li>本アプリのAI機能（骨格診断、食事管理等）は参考情報であり、医学的診断を代替するものではありません</li>
        <li>AIによる分析結果について当ジムは正確性を保証するものではありません</li>
        <li>本アプリの利用によって生じた損害について、当ジムは一切の責任を負いません</li>
      </UL>

      <H2>第7条（サービス内容の変更等）</H2>
      <P>当ジムは事前通知なくサービス内容を変更・追加・停止する場合があります。</P>

      <H2>第8条（利用規約の変更）</H2>
      <P>当ジムは必要に応じて本規約を変更できるものとします。変更後の規約はアプリ内で通知します。</P>

      <H2>第9条（準拠法・裁判管轄）</H2>
      <P>本規約の解釈は日本法を準拠法とし、京都地方裁判所を第一審の専属的合意管轄裁判所とします。</P>

      <H2>第10条（お問い合わせ）</H2>
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

export default Terms;