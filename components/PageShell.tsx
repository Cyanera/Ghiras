import Link from "next/link";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

/** إطار موحّد للصفحات الثانوية: شعار يعود للرئيسية، عنوان، محتوى، تذييل. */
export default function PageShell({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:py-14">
      <header className="flex flex-col items-center gap-2 text-center">
        <Link href="/" aria-label="العودة إلى غِراس">
          <Logo className="h-16 w-16 sm:h-20 sm:w-20" />
        </Link>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-xl text-ink-soft">{subtitle}</p>
        )}
        {updated && (
          <p className="mt-1 text-xs text-ink-soft/70">آخر تحديث: {updated}</p>
        )}
      </header>

      <div className="mt-10 flex flex-col gap-8">{children}</div>

      <SiteFooter />
    </main>
  );
}

/** قسم نظامي: عنوان فرعي + محتوى منسّق. */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-black text-ink">{title}</h2>
      <div className="flex flex-col gap-3 leading-loose text-ink-soft">
        {children}
      </div>
    </section>
  );
}

/** قائمة نقطية منسّقة. */
export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pr-5 marker:text-gold">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
