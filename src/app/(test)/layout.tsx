import { Wordmark } from "@/components/Wordmark";

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="safe-t px-5 pb-3 sm:px-8">
        <Wordmark />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="safe-b px-5 pt-6 text-center text-xs text-ink sm:px-8">
        © {new Date().getFullYear()} Marie-Elizabeth Mali · The Taboo Trilogy ·{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-ink">
          Privacy
        </a>
      </footer>
    </div>
  );
}
