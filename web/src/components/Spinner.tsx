import { Loader2 } from "lucide-react";

const Spinner = ({ className = "h-8 w-8" }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <Loader2 className={`animate-spin ${className}`} />
  </div>
  // <div className="flex justify-center items-center min-h-screen">
  //   <div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div>
  // </div>
);

export default Spinner;
