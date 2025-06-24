import { useState } from "react";
import { useTransactions } from "@/context/TransactionContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MonthPicker from "@/components/MonthPicker";
import TransactionCard from "@/components/TransactionCard";
import { PiggyBank, TrendingDown, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TabView from "@/components/TabView";
import AddTransactionDialog from "@/components/AddTransactionDialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import Spinner from "@/components/Spinner";

const Dashboard = () => {
  const { user } = useAuth();
  const {
    getTransactionsByMonth,
    getGroupTransactions,
    getPersonalTransactions,
    groups, // Add addingTransaction state
    isLoading,
  } = useTransactions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Get transactions for the current month
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyTransactions = getTransactionsByMonth(currentMonth, currentYear);

  // Get personal transactions
  const personalTransactions = getPersonalTransactions().filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  // Get group transactions based on selected group or all groups
  const groupTransactions = selectedGroupId
    ? getGroupTransactions(selectedGroupId).filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
    : monthlyTransactions.filter((t) => t.groupId);

  // Handle dialog state change
  const handleDialogChange = (open: boolean) => {
    setIsAddTransactionOpen(open);
    if (!open) {
      setEditingTransaction(null);
    }
  };

  // Function to handle editing a transaction
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setIsAddTransactionOpen(true);
  };

  // Function to calculate financial summary based on transaction list
  const calculateFinancialSummary = (transactions) => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const balance = income - expenses;

    return { income, expenses, balance };
  };

  // Get category data for chart
  const getCategoryData = (transactions) => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, transaction) => {
        const existingCategory = acc.find(
          (item) => item.name === transaction.category
        );
        if (existingCategory) {
          existingCategory.amount += transaction.amount;
        } else {
          acc.push({ name: transaction.category, amount: transaction.amount });
        }
        return acc;
      }, [] as { name: string; amount: number }[])
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Show top 5 categories only
  };

  // Get recent transactions (top 5)
  const getRecentTransactions = (transactions) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  // Financial summaries
  const personalSummary = calculateFinancialSummary(personalTransactions);
  const groupSummary = calculateFinancialSummary(groupTransactions);

  // Category data
  const personalCategoryData = getCategoryData(personalTransactions);
  const groupCategoryData = getCategoryData(groupTransactions);

  // Recent transactions
  const recentPersonalTransactions =
    getRecentTransactions(personalTransactions);
  const recentGroupTransactions = getRecentTransactions(groupTransactions);

  // Render financial summary cards
  const renderSummaryCards = (summary) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
        {
          title: "Income",
          icon: <TrendingUp className="h-4 w-4 text-income" />,
          value: summary.income,
          color: "text-income",
        },
        {
          title: "Expenses",
          icon: <TrendingDown className="h-4 w-4 text-expense" />,
          value: summary.expenses,
          color: "text-expense",
        },
        {
          title: "Balance",
          icon: <PiggyBank className="h-4 w-4 text-primary" />,
          value: summary.balance,
          color: summary.balance >= 0 ? "text-income" : "text-expense",
        },
      ].map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner className="h-6 w-6" />
            ) : (
              <>
                <div className={`text-2xl font-bold ${item.color}`}>
                  ₹{item.value.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.title === "Income" && "Total income for "}
                  {item.title === "Expenses" && "Total expenses for "}
                  {item.title === "Balance" && "Net balance for "}
                  {currentDate.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render expense category chart
  const renderCategoryChart = (categoryData) => (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Top Expense Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner />
        ) : categoryData.length > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip
                  formatter={(value) => [`₹${value}`, "Amount"]}
                  contentStyle={{ color: "#2c2c2c" }}
                />
                <Bar dataKey="amount" fill="#F87171" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <p>No expense data to display</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingTransaction(null);
                setIsAddTransactionOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Render recent transactions
  const renderRecentTransactions = (transactions) => (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to={"/transactions"}>View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Spinner />
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                onEdit={handleEditTransaction}
              />
            ))}
          </div>
        ) : (
          <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground">
            <p>No transactions to display</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingTransaction(null);
                setIsAddTransactionOpen(true);
              }}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Group filter for group view
  const groupFilterSelect = (
    <div className="mb-4">
      <Select
        value={selectedGroupId || "all"}
        onValueChange={(value) =>
          setSelectedGroupId(value === "all" ? null : value)
        }
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

  // Tab content for personal view
  const personalTabContent = (
    <div className="space-y-6">
      {renderSummaryCards(personalSummary)}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCategoryChart(personalCategoryData)}
        {renderRecentTransactions(recentPersonalTransactions)}
      </div>
    </div>
  );

  // Tab content for group view
  const groupTabContent = (
    <div className="space-y-6">
      {groupFilterSelect}

      {renderSummaryCards(groupSummary)}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderCategoryChart(groupCategoryData)}
        {renderRecentTransactions(recentGroupTransactions)}
      </div>
    </div>
  );

  // Define tabs
  const tabs = [
    {
      value: "personal",
      label: "Personal",
      content: personalTabContent,
    },
    {
      value: "group",
      label: "Group",
      content: groupTabContent,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name}</h1>
        <MonthPicker date={currentDate} onChange={setCurrentDate} />
      </div>

      <TabView tabs={tabs} />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isAddTransactionOpen}
        onOpenChange={handleDialogChange}
        editTransaction={editingTransaction}
      />
    </div>
  );
};

export default Dashboard;
