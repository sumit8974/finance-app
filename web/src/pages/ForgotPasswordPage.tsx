import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import api from "@/api/axios";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { toast } from "@/hooks/use-toast";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast({
        title: "Reset link sent",
        description: "If an account with that email exists, a reset link has been sent.",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error sending reset link",
        description: err.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setEmail("");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 transition-colors">
      <div className="bg-background rounded-lg shadow-lg border animate-fade-in p-8 max-w-md w-full flex flex-col items-center transition-colors">
        <h1 className="text-2xl font-extrabold mb-2 text-teal-600 dark:text-teal-400 text-center">
          Forgot Password
        </h1>
        <p className="mb-4 text-center">
          Enter your email and we’ll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">◌</span>
                Sending reset link...
              </>
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
        <Button type="button" variant="link" className="mt-4">
          <Link to="/login">Back to Login</Link>
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
