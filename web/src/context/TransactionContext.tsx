import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./AuthContext";
import api from "@/api/axios";
import { getToken } from "@/utils/token";

// Define transaction types
export type TransactionType = "expense" | "income";

export type Transaction = {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  type: TransactionType;
  groupId?: string;
  createdBy: string;
};

export type TransactionGroup = {
  id: string;
  name: string;
  members: string[];
  createdBy: string;
};

export type Categories = {
  id: string;
  name: string;
  type: TransactionType;
};

// Define context type
type TransactionContextType = {
  transactions: Transaction[];
  categories: Categories[];
  groups: TransactionGroup[];
  addTransaction: (transaction: Omit<Transaction, "id" | "createdBy">) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  getTransactionsByMonth: (month: number, year: number) => Transaction[];
  getGroupTransactions: (groupId: string) => Transaction[];
  getPersonalTransactions: () => Transaction[];
  addGroup: (name: string, members: string[]) => void;
  updateGroup: (id: string, data: Partial<TransactionGroup>) => void;
  deleteGroup: (id: string) => void;
  getGroupById: (id: string) => TransactionGroup | undefined;
  loading: boolean;
};

// Create context with default values
const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  categories: [],
  groups: [],
  addTransaction: () => {},
  deleteTransaction: () => {},
  updateTransaction: () => {},
  getTransactionsByMonth: () => [],
  getGroupTransactions: () => [],
  getPersonalTransactions: () => [],
  addGroup: () => {},
  updateGroup: () => {},
  deleteGroup: () => {},
  getGroupById: () => undefined,
  loading: true,
});

export const useTransactions = () => useContext(TransactionContext);

// Sample data for initial state
// const sampleCategories = {
//   expense: ['Food', 'Transportation', 'Housing', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Other'],
//   income: ['Salary', 'Bonus', 'Gifts', 'Investments', 'Side Hustle', 'Other']
// };

// Function to generate sample transactions
// const generateSampleTransactions = (userId: string): Transaction[] => {
//   const currentDate = new Date();
//   const transactions: Transaction[] = [];

//   // Generate transactions for the past 3 months
//   for (let i = 0; i < 30; i++) {
//     const date = new Date();
//     date.setDate(currentDate.getDate() - Math.floor(Math.random() * 90)); // Random date within past 3 months

//     const type: TransactionType = Math.random() > 0.7 ? 'income' : 'expense';
//     const categories = sampleCategories[type];

//     transactions.push({
//       id: `trans-${i}`,
//       amount: Math.round(Math.random() * 1000) + 10,
//       description: `Sample ${type}`,
//       category: categories[Math.floor(Math.random() * categories.length)],
//       date: date,
//       type,
//       createdBy: userId,
//     });
//   }

//   return transactions;
// };

// Generate sample groups
const generateSampleGroups = (userId: string): TransactionGroup[] => {
  return [
    {
      id: "group-1",
      name: "Family",
      members: [userId, "user-2", "user-3"],
      createdBy: userId,
    },
    {
      id: "group-2",
      name: "Roommates",
      members: [userId, "user-4"],
      createdBy: userId,
    },
  ];
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Categories[]>([]);
  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load saved transactions and groups on mount or when user changes
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;
      if (!getToken()) return;
      try {
        setLoading(true);
        const loadedTransactions = await api.get(`/transactions`);
        if (!loadedTransactions.data) {
          setLoading(false);
          return;
        }
        const transactions: Transaction[] = loadedTransactions.data.map(
          (transaction: any) => ({
            id: transaction.id,
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.categoryName,
            date: transaction.createdAt,
            type: transaction.transactionType,
            groupId: transaction.groupId,
            createdBy: transaction.userId,
          })
        );
        setTransactions(transactions);
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error loading transactions",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        console.error("Failed to load transactions", error);
        // setTransactions([]);
      }
    };
    loadTransactions();
  }, [user]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (!user) return;
        if (!getToken()) return;
        setLoading(true);
        const loadedCategories = await api.get("/categories");
        const categories: Categories[] = loadedCategories.data.map(
          (category: any) => ({
            id: category.id,
            name: category.name,
            type: category.type,
          })
        );
        setCategories(categories);
        setLoading(false);
      } catch (error) {
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, [user]);

  // Add new transaction
  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdBy">
  ) => {
    if (!user) return;
    console.log("transaction", transaction);
    try {
      const transactionRes = await api.post("/transactions", {
        amount: transaction.amount,
        description: transaction.description,
        categoryName: transaction.category,
        transactionType: transaction.type,
      });
      console.log("transactionRes", transactionRes);

      const newTransaction: Transaction = {
        id: transactionRes.data.id,
        createdBy: transactionRes.data.userId,
        date: transactionRes.data.updatedAt,
        amount: transactionRes.data.amount,
        category: transactionRes.data.categoryName,
        type: transactionRes.data.transactionType,
        description: transactionRes.data.description,
        groupId: transactionRes.data?.groupId,
      };
      console.log("newTransaction", newTransaction);
      setTransactions((prev) => [newTransaction, ...prev]);
      toast({
        title: `${transaction.type === "expense" ? "Expense" : "Income"} added`,
        description: `${transaction.description} - ₹${transaction.amount}`,
      });
    } catch (error) {
      toast({
        title: "Error adding transaction",
        description: error.response.data.error,
        variant: "destructive",
      });
      return;
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error deleting transaction",
        description: error.response.data.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Transaction deleted",
    });
  };

  // Update transaction
  const updateTransaction = async (
    id: string,
    transactionData: Partial<Transaction>
  ) => {
    try {
      const transactionRes = await api.patch(`/transactions/${id}`, {
        amount: transactionData.amount,
        description: transactionData.description,
        categoryName: transactionData.category,
        transactionType: transactionData.type,
      });
      const updatedTransaction: Transaction = {
        id: transactionRes.data.id,
        createdBy: transactionRes.data.userId,
        date: transactionRes.data.updatedAt,
        amount: transactionRes.data.amount,
        category: transactionRes.data.categoryName,
        type: transactionRes.data.transactionType,
        description: transactionRes.data.description,
        groupId: transactionRes.data?.groupId,
      };
      console.log("updatedTransaction", updatedTransaction);
      console.log("transactions", transactions);
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === updatedTransaction.id ? { ...updatedTransaction } : t
        )
      );
      // setTransactions((prev) => [updatedTransaction, ...prev]);

      console.log("transactions2", transactions);
      toast({
        title: "Transaction updated",
        description: `${transactionData.description} - ₹${transactionData.amount}`,
      });
    } catch (error) {
      toast({
        title: "Error updating transaction",
        description: error.response.data.error,
        variant: "destructive",
      });
      return;
    }
  };

  // Get transactions by month
  const getTransactionsByMonth = (month: number, year: number) => {

    return transactions.filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        transactionDate.getMonth() === month &&
        transactionDate.getFullYear() === year
      );
    });
  };

  // Get transactions for a specific group
  const getGroupTransactions = (groupId: string) => {
    return transactions.filter((t) => t.groupId === groupId);
  };

  // Get personal transactions (not associated with any group)
  const getPersonalTransactions = () => {
    return transactions.filter((t) => !t.groupId);
  };

  // Add a new group
  const addGroup = (name: string, members: string[]) => {
    if (!user) return;

    const newGroup: TransactionGroup = {
      id: `group-${Date.now()}`,
      name,
      members: [...members, user.id], // Include the creator
      createdBy: user.id,
    };

    setGroups((prev) => [...prev, newGroup]);

    toast({
      title: "Group created",
      description: `${name} has been created with ${
        members.length + 1
      } members`,
    });
  };

  // Update group
  const updateGroup = (id: string, data: Partial<TransactionGroup>) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...data } : g)));

    toast({
      title: "Group updated",
    });
  };

  // Delete group
  const deleteGroup = (id: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));

    // Also remove group ID from related transactions
    setTransactions((prev) =>
      prev.map((t) => (t.groupId === id ? { ...t, groupId: undefined } : t))
    );

    toast({
      title: "Group deleted",
    });
  };

  // Get group by ID
  const getGroupById = (id: string) => {
    return groups.find((g) => g.id === id);
  };

  const value = {
    transactions,
    groups,
    categories,
    addTransaction,
    deleteTransaction,
    updateTransaction,
    getTransactionsByMonth,
    getGroupTransactions,
    getPersonalTransactions,
    addGroup,
    updateGroup,
    deleteGroup,
    getGroupById,
    loading,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};