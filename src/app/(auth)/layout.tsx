import Link from "next/link";
import LiquidMetalBackground from "@/components/marketing/LiquidMetalBackground";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16">
      <LiquidMetalBackground />
      <Link
        href="/"
        className="relative mb-8 text-lg font-semibold tracking-[0.2em] text-zinc-950"
      >
        PRAEKO
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
