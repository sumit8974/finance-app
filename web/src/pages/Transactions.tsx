import { useState } from 'react';
import { useTransactions, Transaction } from '@/context/TransactionContext';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MonthPicker from '@/components/MonthPicker';
import TransactionCard from '@/components/TransactionCard';
import AddTransactionDialog from '@/components/AddTransactionDialog';
import { Search, Plus, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from '@/hooks/use-mobile';
import TabView from '@/components/TabView';

const Transactions = () => {
  const { 
    transactions, 
    getTransactionsByMonth,
    getPersonalTransactions,
    getGroupTransactions,
    groups
  } = useTransactions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const isMobile = useIsMobile();
  
  // Get transactions for the current month
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyTransactions = getTransactionsByMonth(currentMonth, currentYear);
  
  // Get personal transactions for current month
  const personalTransactions = getPersonalTransactions().filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });
  
  // Get group transactions for current month
  const groupTransactions = selectedGroupId 
    ? getGroupTransactions(selectedGroupId).filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
      }) 
    : monthlyTransactions.filter(t => t.groupId);
  
  // Get all unique categories
  const categories = [...new Set(transactions.map(t => t.category))].sort();
  
  // Apply filters to the transactions list
  const applyFilters = (transactionsList: Transaction[]) => {
    return transactionsList.filter(transaction => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
      
      // Type filter
      const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  };
  
  // Apply filters to personal and group transactions
  const filteredPersonalTransactions = applyFilters(personalTransactions);
  const filteredGroupTransactions = applyFilters(groupTransactions);
  
  // Handle opening the add transaction dialog
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setIsAddDialogOpen(true);
  };
  
  // Handle opening the edit transaction dialog
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsAddDialogOpen(true);
  };
  
  // Handle dialog closing
  const handleDialogChange = (open: boolean) => {
    setIsAddDialogOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };
  
  // Render filters
  const renderFilters = () => {
    // Desktop filters
    if (!isMobile) {
      return (
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="type-filter" className="sr-only">Filter by Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category-filter" className="sr-only">Filter by Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground flex items-center justify-end">
              <Calendar className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Showing</span> {filteredPersonalTransactions.length} transactions for {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </Card>
      );
    }
    
    // Mobile filters
    return (
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Collapsible
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          className="border rounded-md"
        >
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex w-full items-center justify-between">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filters</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {activeTab === "personal" ? filteredPersonalTransactions.length : filteredGroupTransactions.length} results
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="mobile-type-filter">Transaction Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="mobile-type-filter" className="mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="mobile-category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger id="mobile-category-filter" className="mt-1">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent >
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 inline-block mr-1" />
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };
  
  // Group filter selector
  const groupFilterSelect = (
    <div className="mb-4">
      <Select
        value={selectedGroupId || "all"}
        onValueChange={(value) => setSelectedGroupId(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Select Group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Groups</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  
  // Render transactions list
  const renderTransactionsList = (transactions: Transaction[]) => {
    if (transactions.length > 0) {
      return transactions.map(transaction => (
        <TransactionCard 
          key={transaction.id} 
          transaction={transaction} 
          onEdit={handleEditTransaction}
        />
      ));
    }
    
    return (
      <div className="bg-muted/40 rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">No transactions found for this period</p>
        <Button onClick={handleAddTransaction} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Add your first transaction
        </Button>
      </div>
    );
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Tab content for personal transactions
  const personalTabContent = (
    <div>
      {renderFilters()}
      
      <div className="space-y-4">
        {renderTransactionsList(filteredPersonalTransactions)}
      </div>
    </div>
  );
  
  // Tab content for group transactions
  const groupTabContent = (
    <div>
      {groupFilterSelect}
      {renderFilters()}
      
      <div className="space-y-4">
        {renderTransactionsList(filteredGroupTransactions)}
      </div>
    </div>
  );
  
  // Define tabs
  const tabs = [
    {
      value: "personal",
      label: "Personal",
      content: personalTabContent
    },
    {
      value: "group",
      label: "Group",
      content: groupTabContent
    }
  ];
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <MonthPicker date={currentDate} onChange={setCurrentDate} />
          <Button onClick={handleAddTransaction}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>
      
      <TabView 
        tabs={tabs} 
        onValueChange={handleTabChange}
        defaultValue="personal"
      />
      
      {/* Replace the Dialog wrapper with direct AddTransactionDialog component */}
      <AddTransactionDialog 
        open={isAddDialogOpen} 
        onOpenChange={handleDialogChange}
        initialGroupId={activeTab === "group" ? selectedGroupId || undefined : undefined}
        editTransaction={editingTransaction}
      />
    </div>
  );
};

export default Transactions;
