import Link from "next/link";
import Image from "next/image";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pt-6 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Reset password</CardTitle>
            <CardDescription className="text-center">
              We&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
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
