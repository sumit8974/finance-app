import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const CheckEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
  const allowed = sessionStorage.getItem("showCheckEmail");
  if (!allowed) {
  navigate("/register", { replace: true });
  } else {
  // Remove the flag immediately so it can't be reused
  sessionStorage.removeItem("showCheckEmail");
  }
}, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      <div className="bg-background p-10 max-w-md w-full flex flex-col items-center rounded-lg shadow-lg border animate-fade-in">
        <h1 className="text-2xl font-extrabold mb-2 text-center text-primary">
          Verify Your Email
        </h1>
        <p className="mb-4 text-center">
          We’ve sent an activation link to your email address.
          <br />
          Please check your inbox and follow the instructions to activate your
          account.
        </p>
        <div className="bg-teal-950 bg-opacity-70 rounded-lg p-4 mb-4 text-teal-200 text-center text-sm">
          Didn’t receive the email? <br />
          <span className="text-teal-400 font-semibold">
            Check your spam folder
          </span>{" "}
          or&nbsp;
          <Link
            to="/register"
            className="underline text-teal-300 hover:text-teal-400"
          >
            try registering again
          </Link>
          .
        </div>
        <Button type="button" variant="link">
          <Link to="/login">Back to Login</Link>
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default CheckEmail;
