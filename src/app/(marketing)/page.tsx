"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Activity,
  Bell,
  BarChart3,
  Globe,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Check,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const pricingPlans = [
  {
    key: "FREE" as const,
    popular: false,
    cta: "Get Started Free",
    description: "For personal projects",
  },
  {
    key: "STARTER" as const,
    popular: false,
    cta: "Start Free Trial",
    description: "For growing teams",
  },
  {
    key: "PRO" as const,
    popular: true,
    cta: "Start Free Trial",
    description: "For professionals",
  },
  {
    key: "BUSINESS" as const,
    popular: false,
    cta: "Contact Sales",
    description: "For enterprises",
  },
];

function getHighlightFeatures(key: keyof typeof PLANS) {
  const plan = PLANS[key];
  return [
    `${plan.monitors} monitors`,
    `${plan.checkInterval}-min checks`,
    `${plan.historyDays}-day history`,
    `${plan.statusPages} status page${plan.statusPages > 1 ? "s" : ""}`,
  ];
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen brand-gradient">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between overflow-hidden">
          <Link href="/" className="flex items-center overflow-hidden">
            <Image
              src="/logo1.png"
              alt="PulseMon"
              width={240}
              height={160}
              className="h-14 sm:h-32 w-auto object-contain"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="#features" className="text-sm lg:text-base font-semibold hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm lg:text-base font-semibold hover:text-primary transition-colors">
              Pricing
            </Link>
            {isLoggedIn ? (
              <Button asChild size="default" className="font-semibold lg:text-base">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm lg:text-base font-semibold hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Button asChild size="default" className="font-semibold lg:text-base">
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-4 flex flex-col space-y-3">
              <Link
                href="#features"
                className="text-base font-semibold hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-base font-semibold hover:text-primary transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              {isLoggedIn ? (
                <Button asChild size="lg" className="font-semibold w-full">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-base font-semibold hover:text-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Button asChild size="lg" className="font-semibold w-full">
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
            Monitor Your Websites
            <span className="block text-primary mt-2">Stay Online 24/7</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl px-4">
            Get instant alerts when your website goes down. Track uptime, response times,
            and incidents with our powerful monitoring platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 w-full sm:w-auto px-4 sm:px-0">
            <Button asChild size="lg" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>5 monitors free</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span>14-day free trial on paid plans</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full brand-bg py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
              Everything You Need to Stay Online
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Powerful features to monitor, alert, and analyze your website&apos;s uptime
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                <Activity className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Real-time Monitoring</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Check your websites every minute. Get instant notifications when something goes wrong.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                <Bell className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Smart Alerts</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Email, SMS, Slack, and webhook notifications. Never miss a downtime incident.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                <BarChart3 className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Detailed Analytics</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Track uptime percentage, response times, and incident history with beautiful charts.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Public Status Pages</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Share your uptime status with customers. Branded, customizable status pages.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">SSL Monitoring</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Get notified before your SSL certificates expire. Stay secure and compliant.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                <Zap className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Fast & Reliable</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Built on modern infrastructure. 99.9% uptime SLA for our monitoring service.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link href="/features">
                View All Features
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Start free and scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {pricingPlans.map((plan) => {
            const data = PLANS[plan.key];
            const features = getHighlightFeatures(plan.key);

            return (
              <Card
                key={plan.key}
                className={cn(
                  "border-2 transition-colors relative flex flex-col",
                  plan.popular
                    ? "border-primary shadow-card scale-[1.02]"
                    : "hover:border-primary/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pb-4 pt-6">
                  <h3 className="text-lg font-semibold">{data.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1">
                  <div className="mb-5">
                    <span className="text-3xl font-bold">${data.price}</span>
                    <span className="text-muted-foreground text-sm">/mo</span>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    size="default"
                    variant={plan.popular ? "default" : "outline"}
                    className="w-full font-semibold"
                  >
                    <Link href={isLoggedIn ? "/settings" : "/signup"}>
                      {plan.cta}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link href="/pricing" className="text-sm font-semibold text-primary hover:underline">
            Compare all plan features →
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <Card className="bg-primary text-primary-foreground border-0 rounded-2xl sm:rounded-3xl">
          <CardContent className="p-8 sm:p-10 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Ready to Monitor Your Websites?
            </h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto px-2">
              Join thousands of developers and businesses who trust PulseMon to keep their websites online.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t brand-bg">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center overflow-hidden">
              <Image
                src="/logo1.png"
                alt="PulseMon"
                width={200}
                height={130}
                className="h-12 sm:h-20 w-auto object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              &copy; 2025 PulseMon. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
