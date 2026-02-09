import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
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

  return <DashboardLayout email={user.email!}>{children}</DashboardLayout>;
}
