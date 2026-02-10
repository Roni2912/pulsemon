import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Shield, BarChart3 } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo1.png"
                alt="PulseMon"
                width={200}
                height={130}
                className="h-28 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                Keep your websites
                <br />
                running smoothly.
              </h2>
              <p className="mt-3 text-white/80 text-base max-w-md">
                Monitor uptime, track performance, and get instant alerts when things go wrong.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Real-time Monitoring</p>
                  <p className="text-xs text-white/60">Check every 30 seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">SSL Monitoring</p>
                  <p className="text-xs text-white/60">Certificate expiry alerts</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Detailed Analytics</p>
                  <p className="text-xs text-white/60">Response time tracking</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} PulseMon. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/logo1.png"
                alt="PulseMon"
                width={200}
                height={130}
                className="h-40 w-auto object-contain"
              />
            </Link>
          </div>

          <Card className="border shadow-soft">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div className="flex justify-center py-4"><LoadingSpinner /></div>}>
                <LoginForm />
              </Suspense>
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
    </div>
  );
}
