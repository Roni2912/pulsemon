import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Activity, 
  Bell, 
  BarChart3, 
  Globe, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen brand-gradient">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo1.png" 
              alt="PulseMon" 
              width={200} 
              height={50}
              className="w-auto h-auto max-h-50"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button asChild size="lg">
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Monitor Your Websites
            <span className="block text-primary mt-2">Stay Online 24/7</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
            Get instant alerts when your website goes down. Track uptime, response times, 
            and incidents with our powerful monitoring platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-lg px-8">
              <Link href="#features">Learn More</Link>
            </Button>
          </div>

          <div className="flex items-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>5 monitors free</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full brand-bg py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Stay Online
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features to monitor, alert, and analyze your website&apos;s uptime
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <Activity className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-time Monitoring</h3>
              <p className="text-muted-foreground">
                Check your websites every minute. Get instant notifications when something goes wrong.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <Bell className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Alerts</h3>
              <p className="text-muted-foreground">
                Email, SMS, Slack, and webhook notifications. Never miss a downtime incident.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <BarChart3 className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground">
                Track uptime percentage, response times, and incident history with beautiful charts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <Globe className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Public Status Pages</h3>
              <p className="text-muted-foreground">
                Share your uptime status with customers. Branded, customizable status pages.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <Shield className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">SSL Monitoring</h3>
              <p className="text-muted-foreground">
                Get notified before your SSL certificates expire. Stay secure and compliant.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Fast & Reliable</h3>
              <p className="text-muted-foreground">
                Built on modern infrastructure. 99.9% uptime SLA for our monitoring service.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground border-0 rounded-3xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Monitor Your Websites?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of developers and businesses who trust PulseMon to keep their websites online.
            </p>
            <Button asChild size="lg" variant="secondary" className="text-lg px-8">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t brand-bg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <Image 
                src="/logo1.png" 
                alt="PulseMon" 
                width={100} 
                height={25}
                className="w-auto h-auto max-h-50"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PulseMon. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
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
