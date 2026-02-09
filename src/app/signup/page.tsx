import Link from "next/link";
import Image from "next/image";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md">
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-1 pt-6 pb-4">
            <CardTitle className="text-2xl font-bold text-center">Create account</CardTitle>
            <CardDescription className="text-center">
              Start monitoring your websites for free
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
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
  );
}
