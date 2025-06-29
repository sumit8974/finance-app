import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  Users,
  PieChart,
  TrendingUp,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle,
  Zap,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  const features = [
    {
      icon: BarChart3,
      title: "Smart Analytics",
      description:
        "Gain deep insights into your spending patterns with beautiful, interactive charts and comprehensive financial reports.",
      color: "bg-blue-500",
    },
    {
      icon: Users,
      title: "Group Management",
      description:
        "Effortlessly manage shared expenses with friends, family, or roommates. Split bills fairly and track group spending.",
      color: "bg-green-500",
    },
    {
      icon: PieChart,
      title: "Category Tracking",
      description:
        "Automatically categorize transactions and visualize where your money goes with intuitive category breakdowns.",
      color: "bg-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Financial Goals",
      description:
        "Set personalized budgets and track your progress towards achieving important financial milestones.",
      color: "bg-orange-500",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description:
        "Access your finances anywhere with our fully responsive design that works seamlessly on all devices.",
      color: "bg-indigo-500",
    },
  ];

  const benefits = [
    "Track unlimited transactions",
    "Create multiple budget categories",
    "Generate detailed financial reports",
    "Share expenses with unlimited groups",
    "Set up automatic savings goals",
    "Export data in multiple formats",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-md border-b z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              FinTracker
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button className="font-medium shadow-lg">Get Started</Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-4 top-20 z-50">
          <ThemeSwitcher />
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              <span>Trusted by users worldwide</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-8 text-foreground leading-tight">
              Master Your
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {" "}
                Finances
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed max-w-3xl mx-auto">
              Take control of your financial future with our comprehensive
              expense tracking, budgeting tools, and intelligent insights that
              help you make smarter money decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link to="/register">
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {/* <Link to="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-10 py-6 border-2"
                >
                  View Demo
                </Button>
              </Link> */}
            </div>

            {/* Benefits List */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {benefits.slice(0, 3).map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 text-left"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-foreground">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to simplify your financial management
              and help you achieve your money goals faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-card/50 backdrop-blur-sm cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div
                    className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-primary to-primary/90">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-primary-foreground mb-8">
            Ready to Transform Your Financial Future?
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-12 leading-relaxed">
            Join users who have already taken control of their finances. Start
            your journey to financial freedom today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/register">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2 text-primary-foreground/80">
              <Clock className="h-5 w-5" />
              <span>Set up in under 2 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-secondary text-secondary-foreground">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <BarChart3 className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold">FinTracker</h3>
            </div>
            <div className="text-center md:text-right">
              <p className="text-muted-foreground mb-2">
                © 2025 FinTracker. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground">
                Built with ❤️ by Sumit Laishram
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
