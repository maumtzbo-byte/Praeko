import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <ThemeToggle className="fixed right-6 top-6 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-300/80 text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800" />
      <Link
        href="/"
        className="relative mb-8 text-lg font-semibold tracking-[0.2em] text-zinc-950 dark:text-white"
      >
        PRAEKO
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
