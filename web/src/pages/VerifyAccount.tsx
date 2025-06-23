import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import api from "@/api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import Spinner from "@/components/Spinner";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const VerifyAccount = () => {
  const [loading, setLoading] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const verifyAccount = async () => {
    setLoading(true);
    try {
      await api.put(`/users/activate/${token}`);
      setLoading(false);
      toast({
        title: "User account activated successfully",
        description: "Welcome to FinTracker",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      setLoading(false);
      toast({
        title: "User account activation failed",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const validateToken = async () => {
      setVerifyingToken(true);
      try {
        await api.get(`/auth/validate-invitation-token/${token}`);
      } catch (error) {
        toast({
          title: "An error occurred",
          description: error.response?.data?.error || "Please try again later",
          variant: "destructive",
        });
        navigate("/login", { replace: true });
      } finally {
        setVerifyingToken(false);
      }
    };
    validateToken();
  }, []);

  if (verifyingToken) {
    return (
      <div className="flex justify-center items-center min-h-[85vh]">
        <Spinner className="h-10 w-10 mx-auto mt-20" />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-black transition-colors">
      <div
        className="
        w-full max-w-md p-10 rounded-2xl shadow-2xl flex flex-col items-center border
        bg-white border-zinc-200
        dark:bg-zinc-900 dark:border-zinc-800
        transition-colors
      "
      >
        <h1
          className="
          text-3xl font-extrabold mb-2 text-indigo-600 text-center
          dark:text-indigo-400
        "
        >
          Welcome to FinTracker!
        </h1>
        <p
          className="
          text-zinc-700 mb-4 text-center
          dark:text-zinc-200
        "
        >
          Your journey to smarter financial management starts here.
        </p>
        <div
          className="
          bg-indigo-100 text-indigo-700
          dark:bg-indigo-950 dark:bg-opacity-70 dark:text-indigo-200
          rounded-lg p-4 mb-6 text-center text-sm
          transition-colors
        "
        >
          To complete your registration, please verify your account by clicking
          the button below.
          <br />
          This helps us keep your account secure and personalized.
        </div>
        <Button
          onClick={verifyAccount}
          disabled={loading}
          className="
            w-full py-2 text-lg font-semibold rounded-lg transition
            bg-indigo-600 hover:bg-indigo-700 text-white
            dark:bg-indigo-600 dark:hover:bg-indigo-700
          "
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">◌</span>
              Activating...
            </>
          ) : (
            <>Activate Account</>
          )}
        </Button>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
    </div>
  );
};

export default VerifyAccount;
