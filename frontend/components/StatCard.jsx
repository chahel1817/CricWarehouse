const toneMap = {
  boundary: "bg-boundary",
  trophy: "bg-trophy",
  royal: "bg-royal",
  wicket: "bg-wicket",
};

export default function StatCard({ label, value, tone = "boundary", detail }) {
  return (
    <article className="group relative overflow-hidden border border-ink bg-paper p-5 shadow-hard transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className={`shape-grain absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-80 ${toneMap[tone]}`} />
      <div className={`relative mb-6 h-2.5 w-14 rounded-full ${toneMap[tone]}`} />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.2em] text-ink/50">{label}</p>
      <p className="relative mt-2 text-4xl font-black tracking-tight md:text-[2.75rem]">{value}</p>
      {detail ? (
        <p className="relative mt-3 text-sm leading-6 text-ink/60">{detail}</p>
      ) : null}
    </article>
  );
}
