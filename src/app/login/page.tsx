import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pt-6 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <div className="text-sm text-muted-foreground text-center">
              <Link href="/reset-password" className="hover:text-primary underline underline-offset-4 transition-colors">
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary hover:underline underline-offset-4 font-semibold transition-colors">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
