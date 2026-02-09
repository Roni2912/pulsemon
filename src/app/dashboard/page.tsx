export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your monitors
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Total Monitors</p>
          </div>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Up</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-green-600">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Down</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Uptime</p>
          </div>
          <p className="mt-2 text-3xl font-bold">100%</p>
        </div>
      </div>
    </div>
  );
}
