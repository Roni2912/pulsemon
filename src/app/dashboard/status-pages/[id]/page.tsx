export default function StatusPageDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Status Page Details</h2>
      <p className="text-sm text-muted-foreground">Status Page ID: {params.id}</p>
    </div>
  );
}
