import { HealthStatus } from "@/lib/telemetry";

const STROKE: Record<HealthStatus, string> = {
  NORMAL: "text-accent",
  WARNING: "text-warning",
  CRITICAL: "text-critical",
};

export default function AstronautSilhouette({
  status = "NORMAL",
}: {
  status?: HealthStatus;
}) {
  return (
    <svg
      viewBox="0 0 200 320"
      role="img"
      aria-label="Astronaut silhouette"
      className={`h-[260px] w-auto lg:h-[320px] ${STROKE[status]}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    >
      {/* Helmet */}
      <circle cx="100" cy="48" r="26" fill="currentColor" fillOpacity="0.12" />
      <path d="M84 48a16 16 0 0 1 32 0" stroke="currentColor" opacity="0.5" fill="none" />
      {/* Torso */}
      <path d="M72 92h56l10 88H62l10-88Z" fill="currentColor" fillOpacity="0.12" />
      {/* Chest pack */}
      <rect x="82" y="112" width="36" height="30" rx="4" stroke="currentColor" opacity="0.7" fill="none" />
      {/* Arms */}
      <path d="M72 96 50 150l14 8 18-46" fill="none" />
      <path d="M128 96l22 54-14 8-18-46" fill="none" />
      {/* Legs */}
      <path d="M76 180l-6 88h20l10-88" fill="none" />
      <path d="M124 180l6 88h-20l-10-88" fill="none" />
      {/* Boots */}
      <path d="M70 268h20M110 268h20" />
    </svg>
  );
}
