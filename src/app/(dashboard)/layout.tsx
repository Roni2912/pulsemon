import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Temporarily disabled authentication for preview
  // const user = await getUser();
  // if (!user) {
  //   redirect("/login");
  // }

  // Mock user for preview
  const mockUser = { email: "demo@example.com" };

  return <DashboardLayout email={mockUser.email}>{children}</DashboardLayout>;
}
