import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CreditCard, User } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/settings/alerts">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Alert Settings</CardTitle>
                  <CardDescription>Configure notifications</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage how you receive alerts for monitor events
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your account</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Update your profile information and preferences
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Coming soon</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage your subscription and billing information
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
