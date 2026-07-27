import Link from "next/link";
import { WHATSAPP_NUMBER, ORDER_EMAIL, BUSINESS_INFO } from "@/lib/services";

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/khadamat", label: "الخدمات" },
  { href: "/about", label: "من نحن" },
  { href: "/terms", label: "الشروط والأحكام" },
  { href: "/privacy", label: "سياسة الخصوصية" },
  { href: "/refund", label: "سياسة الاسترجاع" },
  { href: "/contact", label: "تواصل معنا" },
];

export default function SiteFooter() {
  const hasWhatsapp = WHATSAPP_NUMBER.trim().length > 0;

  return (
    <footer className="mt-16 flex w-full flex-col items-center gap-5 border-t border-line pt-10 text-center">
      <p className="text-sm text-ink-soft/80">
        غِراس <span className="text-rose">♥︎</span> قصص تُكتب بحب لأطفالكم
      </p>

      <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-ink-soft transition hover:text-blue-deep"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        {hasWhatsapp && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="راسلنا عبر واتساب"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-soft transition hover:border-grass hover:text-grass"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.33 4.95L2.05 22l5.28-1.38a9.86 9.86 0 0 0 4.71 1.2h.004c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.003a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.19 8.19 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14 0-.31-.02-.47-.02s-.43.06-.65.31c-.22.24-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.12.16 1.73 2.64 4.19 3.7.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28Z" />
            </svg>
          </a>
        )}
        <a
          href={`mailto:${ORDER_EMAIL}`}
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

      <p className="text-xs text-ink-soft/70">
        © {BUSINESS_INFO.since} {BUSINESS_INFO.name}. جميع الحقوق محفوظة.
      </p>
    </footer>
  );
}
