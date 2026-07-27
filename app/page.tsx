import Link from "next/link";
import GhirasApp from "@/components/GhirasApp";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-4 py-10 sm:py-14">
      <header className="mb-9 flex flex-col items-center gap-1 text-center">
        <Logo className="h-28 w-28 sm:h-32 sm:w-32" />
        <h1 className="mt-2 text-5xl font-black tracking-tight text-ink sm:text-6xl">
          غِراس
        </h1>
        <p className="mt-1 text-lg font-medium text-ink-soft sm:text-xl">
          قصصٌ تُروى، وقيمٌ تُغرس
        </p>
      </header>

      <GhirasApp />

      <Link
        href="/khadamat"
        className="mt-12 flex w-full max-w-xl items-center justify-between gap-4 rounded-2xl border border-line bg-white px-5 py-4 text-start shadow-[0_10px_30px_-18px_rgba(42,37,48,0.22)] transition hover:border-blue"
      >
        <span className="flex flex-col">
          <span className="font-bold text-ink">تبين لمسة أجمل لقصتك؟</span>
          <span className="text-sm text-ink-soft">
            أضيفي صورًا، أو رسمة تشبه ملامح طفلك، أو حوّليها قصة مصوّرة كاملة — خدمات غِراس.
          </span>
        </span>
        <span className="btn-gradient shrink-0 rounded-full px-5 py-2.5 text-sm font-bold text-white">
          الخدمات
        </span>
      </Link>

      <SiteFooter />
    </main>
  );
}
