/** Shown only when JavaScript is off — the calculator runs in the browser. */
export function NoScriptNotice() {
  return (
    <noscript>
      <p className="mb-6 rounded-2xl border border-caution-line bg-caution-soft p-4 text-[15px] text-ink">
        The calculator runs in your browser and needs JavaScript. Please enable it to get your rate.
      </p>
    </noscript>
  );
}
