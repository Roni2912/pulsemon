export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s an overview of your monitors
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">Total Monitors</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">Up</p>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">Down</p>
          <p className="mt-2 text-3xl font-bold text-red-500">0</p>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-soft">
          <p className="text-sm font-medium text-muted-foreground">Uptime</p>
          <p className="mt-2 text-3xl font-bold text-primary">100%</p>
        </div>
      </div>
    </div>
  );
}
