import { USAGE_DURATION_IDS, USAGE_TYPE_IDS } from "@/lib/pricing/catalog";
import { PRICING_CONFIG as CFG } from "@/lib/pricing/config";
import type { UsageTypeId } from "@/lib/pricing/types";

const pct = (n: number) => `+${Math.round(n * 100)}%`;

/** Usage fees straight from the pricing config, so the page can never drift from the calculator. */
export function UsageTable({ only }: { only?: UsageTypeId }) {
  const types = USAGE_TYPE_IDS.filter((id) => id !== "none" && (!only || id === only));
  return (
    <figure>
      <figcaption className="mb-4 text-[14.5px] leading-relaxed text-muted">
        Usage fee as a share of the content fee, by type and term. These are the planning assumptions this calculator
        uses — not a market standard.
      </figcaption>

      {/* Phones: one card per usage type. */}
      <div className="grid gap-3 sm:hidden">
        {types.map((id) => (
          <div key={id} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-[15px] font-semibold text-ink">{CFG.usageTypes[id].label}</p>
            <dl className="mt-3 grid grid-cols-3 gap-2">
              {USAGE_DURATION_IDS.map((d) => (
                <div key={d} className="rounded-xl bg-subtle px-2.5 py-2">
                  <dt className="text-[12px] text-muted">{CFG.usageDurations[d].label}</dt>
                  <dd className="text-[15px] font-semibold text-ink tabular-nums">{pct(CFG.usageTypes[id].fees[d])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {/* Larger screens: a proper table. */}
      <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface sm:block">
        <table className="w-full text-left text-[15px]">
          <thead className="bg-subtle text-[13px] text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Usage
              </th>
              {USAGE_DURATION_IDS.map((d) => (
                <th key={d} scope="col" className="px-4 py-3 text-right font-medium">
                  {CFG.usageDurations[d].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {types.map((id) => (
              <tr key={id}>
                <th scope="row" className="px-4 py-3 font-semibold text-ink">
                  {CFG.usageTypes[id].shortLabel}
                </th>
                {USAGE_DURATION_IDS.map((d) => (
                  <td key={d} className="px-4 py-3 text-right text-ink-soft tabular-nums">
                    {pct(CFG.usageTypes[id].fees[d])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
