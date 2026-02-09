import Link from "next/link";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 gradient-blue-radial">
      <div className="w-full max-w-[400px]">
        <Card className="border shadow-soft">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-center">Reset password</CardTitle>
            <CardDescription className="text-center">
              We&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordResetForm />
          </CardContent>
          <CardFooter className="pt-2">
            <div className="text-sm text-muted-foreground text-center w-full">
              Remember your password?{" "}
              <Link href="/login" className="text-primary hover:underline underline-offset-4 font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
