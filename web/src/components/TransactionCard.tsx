
import { formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  Tag, 
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Transaction } from '@/context/TransactionContext';
import { useTransactions } from '@/context/TransactionContext';

interface TransactionCardProps {
  transaction: Transaction;
  onEdit?: (transaction: Transaction) => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction,
  onEdit 
}) => {
  const { deleteTransaction } = useTransactions();
  const { id, amount, description, category, date, type } = transaction;
  
  const formattedDate = formatDistanceToNow(new Date(date), { addSuffix: true });
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit(transaction);
    }
  };
  
  const handleDelete = () => {
    deleteTransaction(id);
  };
  
  return (
    <div className={`transaction-card ${type === 'expense' ? 'transaction-card-expense' : 'transaction-card-income'}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-medium">{description}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <Tag className="h-3 w-3 mr-1" />
            <span>{category}</span>
            <span className="mx-2">•</span>
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className={`flex items-center font-medium text-lg ${type === 'expense' ? 'text-expense' : 'text-income'}`}>
            {type === 'expense' ? (
              <ArrowUpRight className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 mr-1" />
            )}
            ₹{amount.toFixed(2)}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
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
