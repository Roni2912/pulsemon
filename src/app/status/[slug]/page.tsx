export default function PublicStatusPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Status Page</h1>
        <p className="text-sm text-muted-foreground">Slug: {params.slug}</p>
      </div>
    </div>
  );
}
