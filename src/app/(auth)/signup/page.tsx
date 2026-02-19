import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-blue relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZ2Q+PC9nPg==')] opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="PulseMon icon"
                width={252}
                height={258}
                className="h-12 w-12 object-contain flex-shrink-0 brightness-0 invert"
              />
              <Image
                src="/name.png"
                alt="PulseMon"
                width={597}
                height={118}
                className="h-9 w-auto object-contain brightness-0 invert"
              />
            </Link>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-bold leading-tight">
                Start monitoring
                <br />
                in under 2 minutes.
              </h2>
              <p className="mt-3 text-white/80 text-base max-w-md">
                Set up your first monitor and start getting alerts right away. No credit card required.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "5 monitors free forever",
                "1-minute check intervals",
                "Email & Slack alerts",
                "Public status pages",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-white/70 flex-shrink-0" />
                  <p className="text-sm text-white/80">{item}</p>
                </div>
              ))}
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
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="PulseMon icon"
                width={252}
                height={258}
                className="h-12 w-12 object-contain flex-shrink-0"
              />
              <Image
                src="/name.png"
                alt="PulseMon"
                width={597}
                height={118}
                className="h-9 w-auto object-contain"
                style={{ filter: 'brightness(0) saturate(100%) invert(11%) sepia(14%) saturate(1200%) hue-rotate(185deg) brightness(95%) contrast(93%)' }}
              />
            </Link>
          </div>

          <Card className="border shadow-soft">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-bold">Create account</CardTitle>
              <CardDescription>
                Start monitoring your websites for free
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupForm />
            </CardContent>
            <CardFooter className="pt-2">
              <div className="text-sm text-muted-foreground text-center w-full">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline underline-offset-4 font-semibold transition-colors">
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
