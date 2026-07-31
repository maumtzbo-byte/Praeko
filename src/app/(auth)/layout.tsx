import Link from "next/link";
import { FramesMark } from "@/components/brand/FramesMark";
import { AuthGallery } from "@/components/auth/AuthGallery";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <AuthGallery />
      <Link
        href="/"
        className="relative z-10 mb-8 flex items-center gap-2 text-lg font-semibold tracking-[0.2em] text-zinc-950"
      >
        <FramesMark className="h-5 w-5" />
        FRAMES
      </Link>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}
