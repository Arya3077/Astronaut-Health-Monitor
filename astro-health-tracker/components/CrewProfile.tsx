import Image from "next/image";
import { CREW } from "@/lib/crew";
import { formatMET, getMissionDay } from "@/lib/time";

export default function CrewProfile({
  t,
  className = "",
}: {
  t: number;
  className?: string;
}) {
  return (
    <section
      aria-label="Crew member"
      className={`min-w-0 rounded-sm border border-border bg-panel ${className}`}
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="font-mono text-[11px] tracking-[0.18em] text-muted">
          CREW MEMBER
        </h2>
      </header>
      <div className="p-4">
        <div className="flex items-start gap-4">
          <Image
            src="/crew-photo.svg"
            alt="Crew identification photo of Alex Carter in a pressurized suit"
            width={80}
            height={96}
            className="h-24 w-20 shrink-0 rounded-sm border border-border-strong object-cover"
          />
          <div className="min-w-0">
            <p className="break-words text-xl font-semibold tracking-[0.08em]">
              {CREW.name.toUpperCase()}
            </p>
            <p className="mt-1 text-sm text-accent">{CREW.role}</p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-muted">
              {CREW.mission.toUpperCase()} · DAY {getMissionDay(t)}
            </p>
          </div>
        </div>
        <dl className="mt-4 space-y-2.5 border-t border-border pt-4 text-sm">
          {[
            ["MISSION", CREW.mission],
            ["TIME IN ORBIT", `${CREW.daysInOrbit} days`],
            ["MISSION DAY", String(getMissionDay(t))],
            ["MISSION CLOCK", formatMET(t)],
            ["VEHICLE", CREW.vehicle],
            ["SUIT LOOP", CREW.suitLoop],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <dt className="font-mono text-[10px] tracking-[0.18em] text-muted">
                {k}
              </dt>
              <dd className="min-w-0 break-words text-right text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
