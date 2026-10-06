import { EXCLUSIVITY_IDS } from "@/lib/pricing/catalog";
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";

/** Exclusivity fees straight from the pricing config. */
export function ExclusivityTable() {
  const rows = EXCLUSIVITY_IDS.filter((id) => CFG.exclusivity[id].fee > 0);
  return (
    <figure>
      <figcaption className="mb-4 text-[14.5px] leading-relaxed text-muted">
        Exclusivity fee as a share of the content fee. These are the planning assumptions this calculator uses — not a
        market standard.
      </figcaption>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map((id) => (
          <div key={id} className="rounded-2xl border border-line bg-surface px-4 py-3">
            <dt className="text-[13px] text-muted">{CFG.exclusivity[id].label}</dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink tabular-nums">+{Math.round(CFG.exclusivity[id].fee * 100)}%</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
