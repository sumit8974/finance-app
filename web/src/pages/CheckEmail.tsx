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
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-10 max-w-md w-full flex flex-col items-center">
        <img
          src="https://cdn-icons-png.flaticon.com/512/561/561127.png"
          alt="Check Email"
          className="w-20 h-20 mb-6"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <h1 className="text-2xl font-extrabold mb-2 text-indigo-400 text-center">
          Verify Your Email
        </h1>
        <p className="text-zinc-200 mb-4 text-center">
          We’ve sent an activation link to your email address.
          <br />
          Please check your inbox and follow the instructions to activate your
          account.
        </p>
        <div className="bg-indigo-950 bg-opacity-70 rounded-lg p-4 mb-6 text-indigo-200 text-center text-sm">
          Didn’t receive the email? <br />
          <span className="text-indigo-400 font-semibold">
            Check your spam folder
          </span>{" "}
          or&nbsp;
          <Link
            to="/register"
            className="underline text-indigo-300 hover:text-indigo-400"
          >
            try registering again
          </Link>
          .
        </div>
        <Link
          to="/login"
          className="w-full text-center py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default CheckEmail;
