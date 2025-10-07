export default function Panel(props: {
  title: string;
  children: React.ReactNode;
}) {
  const { title, children } = props;
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
