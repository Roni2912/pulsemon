import { redirect } from "next/navigation";
import { getUser, getUserProfile } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getUserProfile();

  return (
    <DashboardLayout
      email={user.email!}
      name={profile?.full_name || undefined}
    >
      {children}
    </DashboardLayout>
  );
}
