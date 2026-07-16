export default function LiquidMetalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="liquid-blob absolute -left-32 -top-24 h-[26rem] w-[26rem] opacity-90"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #ffffff 0%, #d6d8dd 30%, #8a8c93 55%, #55565c 70%, #3d3e44 100%)",
        }}
      />
      <div
        className="liquid-blob absolute -right-40 -top-10 h-[30rem] w-[30rem] opacity-80"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, #ffffff 0%, #cfd1d6 35%, #75767d 65%, #2c2d31 100%)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="liquid-blob absolute -bottom-40 -left-24 h-[24rem] w-[24rem] opacity-70"
        style={{
          background:
            "radial-gradient(circle at 40% 60%, #ffffff 0%, #d3d5da 35%, #6d6e75 70%, #232427 100%)",
          animationDelay: "-11s",
        }}
      />
      <div
        className="liquid-blob absolute -bottom-32 -right-32 h-[28rem] w-[28rem] opacity-80"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, #ffffff 0%, #d8dadf 30%, #85868d 60%, #2f3034 100%)",
          animationDelay: "-3s",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_75%)]" />
    </div>
  );
}
