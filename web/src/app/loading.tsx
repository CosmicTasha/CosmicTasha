export default function GlobalLoading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 h-0.5">
      <div className="h-full animate-pulse bg-ct-accent" style={{ width: "80%" }} />
    </div>
  );
}
