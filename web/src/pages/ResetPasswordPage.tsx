import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import api from "@/api/axios";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        await api.get(`/auth/validate-reset-token/${token}`);
      } catch (error: any) {
        toast({
          title: "Invalid or expired token",
          description:
            error.response?.data?.error || "Please request a new reset link.",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      } finally {
        setValidatingToken(false);
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }
    try {
      setResettingPassword(true);
      await api.put(`/auth/reset-password`, { token, password });
    } catch (error: any) {
      toast({
        title: "Error resetting password",
        description: error.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
      return;
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      setResettingPassword(false);
    }
    toast({
      title: "Password reset successful",
      description: "You can now log in with your new password.",
      variant: "default",
    });
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  if (validatingToken) {
    return (
      <div className="flex justify-center items-center min-h-[85vh]">
        <Spinner className="h-10 w-10 mx-auto mt-20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30 transition-colors">
      <div className="bg-background p-8 max-w-md w-full flex flex-col items-center transition-colors rounded-lg shadow-lg border animate-fade-in">
        <h1 className="text-3xl font-bold text-primary mb-3">Reset Password</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4 ">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Button type="submit" disabled={resettingPassword}>
            {resettingPassword ? (
              <>
                <span className="animate-spin mr-2">◌</span>
                Resetting password...
              </>
            ) : (
              "Reset Password"
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

export default ResetPasswordPage;
