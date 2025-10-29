export default function Panel(props: {
  title?: string; // made optional
  children: React.ReactNode;
}) {
  const { title, children } = props;

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      {title && ( 
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}
