export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="liquid-blob absolute -left-32 -top-24 h-[26rem] w-[26rem] opacity-60"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, var(--aurora-highlight) 0%, var(--aurora-mid) 28%, var(--accent) 55%, var(--accent-strong) 78%, var(--aurora-deep) 100%)",
        }}
      />
      <div
        className="liquid-blob absolute -right-40 -top-10 h-[30rem] w-[30rem] opacity-50"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, var(--aurora-highlight) 0%, var(--aurora-mid) 30%, var(--aurora-blue) 58%, var(--aurora-deep) 100%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="liquid-blob absolute -bottom-40 -left-24 h-[24rem] w-[24rem] opacity-45"
        style={{
          background:
            "radial-gradient(circle at 40% 60%, var(--aurora-highlight) 0%, var(--aurora-mid) 35%, var(--accent-strong) 68%, var(--aurora-deep) 100%)",
          animationDelay: "-11s",
        }}
      />
      <div
        className="liquid-blob absolute -bottom-32 -right-32 h-[28rem] w-[28rem] opacity-50"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, var(--aurora-highlight) 0%, var(--aurora-mid) 28%, var(--accent) 60%, var(--aurora-deep) 100%)",
          animationDelay: "-3s",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />
    </div>
  );
}
