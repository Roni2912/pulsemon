export default function MonitorDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Monitor Details</h2>
      <p className="text-sm text-muted-foreground">Monitor ID: {params.id}</p>
    </div>
  );
}
