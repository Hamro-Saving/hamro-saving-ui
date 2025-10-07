export default function KpiCard(props: {
  label: string;
  value: string;
  sub?: string;
}) {
  const { label, value, sub } = props;
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
