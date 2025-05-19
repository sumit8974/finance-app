
import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  ArrowLeft, 
  PlusCircle, 
  MoreVertical,
  Trash2,
  UserPlus,
  Mail
} from 'lucide-react';
import TransactionCard from '@/components/TransactionCard';
import MonthPicker from '@/components/MonthPicker';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddTransactionDialog from '@/components/AddTransactionDialog';

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    getGroupById, 
    getGroupTransactions, 
    deleteGroup,
    updateGroup
  } = useTransactions();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  
  if (!id) {
    return <div>Group not found</div>;
  }
  
  const group = getGroupById(id);
  
  if (!group) {
    return <div>Group not found</div>;
  }
  
  // Get transactions for this group in the current month
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const transactions = getGroupTransactions(id)
    .filter(t => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === currentMonth && 
        transactionDate.getFullYear() === currentYear
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Calculate total expenses for the group
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  // Calculate total expenses per person
  const expensePerPerson = totalExpenses / group.members.length;
  
  const handleDeleteGroup = () => {
    deleteGroup(id);
    navigate('/groups');
  };
  
  const handleAddMember = () => {
    if (!newMemberEmail.trim()) return;
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newMemberEmail)) return;
    
    // Check if member already exists
    if (group.members.includes(newMemberEmail)) return;
    
    // Update group with new member
    updateGroup(id, { 
      members: [...group.members, newMemberEmail] 
    });
    
    setNewMemberEmail('');
    setIsAddMemberOpen(false);
  };
  
  const handleRemoveMember = (email: string) => {
    if (group.members.length <= 1) return;
    
    // Don't allow removing the creator
    if (email === user?.id) return;
    
    updateGroup(id, { 
      members: group.members.filter(m => m !== email) 
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-2 p-2">
            <Link to="/groups">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{group.name}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <MonthPicker date={currentDate} onChange={setCurrentDate} />
          <Button onClick={() => setIsAddTransactionOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Invite via Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Members and summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Members ({group.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {user && (
                <li key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </li>
              )}
              {group.members
                .filter(m => m !== user?.id)
                .map(member => (
                  <li key={member} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {member.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-2">
                        <p className="text-sm font-medium">
                          {member.includes('@') 
                            ? member.split('@')[0]
                            : `User ${member.slice(-4)}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{member}</p>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
            </ul>
            
            <Button variant="outline" className="w-full mt-4" onClick={() => setIsAddMemberOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="text-lg font-medium">${totalExpenses.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-muted-foreground">Number of Members</span>
                <span className="text-lg font-medium">{group.members.length}</span>
              </div>
              
              <div className="flex justify-between items-center pb-2">
                <span className="text-muted-foreground">Per Person</span>
                <span className="text-lg font-medium text-primary">${expensePerPerson.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transactions section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">
            Transactions for {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" onClick={() => setIsAddTransactionOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
        
        <div className="space-y-4">
          {transactions.length > 0 ? (
            transactions.map(transaction => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))
          ) : (
            <div className="bg-muted/40 rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-4">No transactions for this period</p>
              <Button onClick={() => setIsAddTransactionOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Group Expense
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Add a new member to {group.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <input
                type="email" 
                placeholder="Enter email address"
                className="w-full px-3 py-2 border rounded-md"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {group.name} group and remove all associated transactions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <AddTransactionDialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen} />
      </Dialog>
    </div>
  );
};

export default GroupDetail;
