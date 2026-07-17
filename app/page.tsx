import GhirasApp from "@/components/GhirasApp";
import Logo from "@/components/Logo";

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

      <footer className="mt-14 flex flex-col items-center gap-4">
        <p className="text-sm text-ink-soft/80">
          غِراس <span className="text-rose">♥︎</span> قصص تُكتب بحب لأطفالكم
        </p>
        <div className="flex items-center gap-3">
          <a
            href="mailto:cyanera38@gmail.com"
            aria-label="راسلنا عبر البريد"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-blue hover:text-blue"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </a>
          <a
            href="https://github.com/Cyanera/Ghiras"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="المستودع على GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-blue hover:text-blue"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
            </svg>
          </a>
        </div>
      </footer>
    </main>
  );
}
