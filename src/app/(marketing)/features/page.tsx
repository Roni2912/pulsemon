import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Bell,
  BarChart3,
  Globe,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  LineChart,
  Users,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description:
      "Check your websites every minute from multiple locations. Detect downtime the moment it happens with sub-minute detection.",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description:
      "Email, webhook, and Slack notifications with intelligent rate limiting. No alert fatigue — only get notified when it matters.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description:
      "Track uptime percentages across 24h, 7d, and 30d windows. Visualize response time trends with interactive charts.",
  },
  {
    icon: Globe,
    title: "Public Status Pages",
    description:
      "Share branded status pages with your customers. Show real-time status, uptime percentages, and incident history.",
  },
  {
    icon: Shield,
    title: "SSL Monitoring",
    description:
      "Automatically monitor SSL certificate validity. Get warned before certificates expire so you stay secure.",
  },
  {
    icon: Zap,
    title: "Fast & Reliable",
    description:
      "Built on modern serverless infrastructure. Our monitoring service runs with 99.9% uptime SLA.",
  },
  {
    icon: Clock,
    title: "Incident Tracking",
    description:
      "Automatic incident creation when monitors go down. Track duration, resolution time, and root causes.",
  },
  {
    icon: LineChart,
    title: "Response Time Charts",
    description:
      "Beautiful Recharts-powered visualizations showing response time history with downtime gap indicators.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Invite team members to your workspace. Share monitors, incidents, and status pages across your organization.",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    description:
      "Row-level security on all data. Your monitoring data is isolated and encrypted at rest and in transit.",
  },
  {
    icon: CheckCircle2,
    title: "Uptime SLA Reporting",
    description:
      "Generate uptime reports for any time period. Perfect for SLA compliance and stakeholder reporting.",
  },
  {
    icon: ArrowRight,
    title: "Webhook Integrations",
    description:
      "Send alerts to any webhook endpoint. Integrate with PagerDuty, Opsgenie, Discord, or your custom systems.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen brand-gradient">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
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
            <Link href="/features" className="text-sm lg:text-base font-semibold text-primary">
              Features
            </Link>
            <Link href="/login" className="text-sm lg:text-base font-semibold hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button asChild size="default" className="font-semibold">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
          <Button asChild size="sm" className="md:hidden">
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything You Need to
            <span className="block text-primary mt-2">Keep Your Sites Online</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            PulseMon provides comprehensive monitoring, alerting, and reporting tools
            to ensure your websites and APIs are always available.
          </p>
          <Button asChild size="lg" className="text-base px-8">
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="w-full brand-bg py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-5 sm:pt-6 px-4 sm:px-6">
                  <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-primary mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <Card className="bg-primary text-primary-foreground border-0 rounded-2xl sm:rounded-3xl">
          <CardContent className="p-8 sm:p-10 md:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base sm:text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Start monitoring your websites in under 2 minutes. No credit card required.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-base px-8">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t brand-bg">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center overflow-hidden">
              <Image
                src="/logo1.png"
                alt="PulseMon"
                width={200}
                height={130}
                className="h-12 sm:h-20 w-auto object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2024 PulseMon. All rights reserved.
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
