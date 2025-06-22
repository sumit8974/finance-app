import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Transaction } from "@/context/TransactionContext";
import { useTransactions } from "@/context/TransactionContext";

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onEdit,
}) => {
  const { deleteTransaction } = useTransactions();
  const { id, amount, description, category, createdAt: date, type } = transaction;

  const formattedDate = formatDistanceToNow(new Date(date), {
    addSuffix: true,
  });

  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };

  const handleDelete = () => {
    deleteTransaction(id);
  };

  return (
    <div
      className={`transaction-card ${
        type === "expense"
          ? "transaction-card-expense"
          : "transaction-card-income"
      } px-5 py-4 mb-4 rounded-xl`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Description and meta */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base truncate">{description}</h3>
          <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-x-2 gap-y-1">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>{category}</span>
            </div>
            {/* <span className="hidden sm:inline">•</span> */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>
        {/* Right: Amount and actions */}
        <div className="flex items-center justify-between sm:justify-end gap-2 min-w-[120px]">
          <div
            className={`flex items-center font-medium text-lg ${
              type === "expense" ? "text-expense" : "text-income"
            }`}
          >
            {type === "expense" ? (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            )}
            ₹{amount.toFixed(2)}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
