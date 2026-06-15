export function MfLogo({ size = 80 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle at 30% 30%, #4a7d5e 0%, #1f4d3a 70%, #0f2e22 100%)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35), inset 0 0 0 3px rgba(255,255,255,0.95), inset 0 0 0 5px #1f4d3a, inset 0 0 0 6px rgba(220,216,168,0.6)",
      }}
    >
      <span
        className="font-serif font-bold text-white tracking-wider"
        style={{ fontSize: size * 0.42, textShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
      >
        MF
      </span>
    </div>
  );
}
