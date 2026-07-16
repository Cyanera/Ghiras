import GhirasApp from "@/components/GhirasApp";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-4 py-12 sm:py-16">
      <header className="no-print mb-10 flex flex-col items-center gap-3 text-center">
        <Logo className="h-20 w-20 sm:h-24 sm:w-24" />
        <h1 className="text-6xl font-black text-leaf-deep sm:text-7xl">غِراس</h1>
        <p className="text-xl text-ink-soft sm:text-2xl">قصصٌ تُروى، وقيمٌ تُغرس</p>
      </header>

      <GhirasApp />

      <footer className="no-print mt-14 text-sm text-ink-soft/70">
        غِراس — قصص تُكتب بحب لأطفالكم
      </footer>
    </main>
  );
}
