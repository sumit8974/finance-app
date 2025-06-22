import { Loader2 } from "lucide-react";

const Spinner = ({ className = "h-8 w-8" }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <Loader2 className={`animate-spin ${className}`} />
  </div>
);

export default Spinner;
