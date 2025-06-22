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
  addTransaction: (transaction: Omit<Transaction, "id" | "createdBy">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  getTransactionsByMonth: (month: number, year: number) => Transaction[];
  getGroupTransactions: (groupId: string) => Transaction[];
  getPersonalTransactions: () => Transaction[];
  addGroup: (name: string, members: string[]) => void;
  updateGroup: (id: string, data: Partial<TransactionGroup>) => void;
  deleteGroup: (id: string) => void;
  getGroupById: (id: string) => TransactionGroup | undefined;
  isLoading: boolean;
};

const TransactionContext = createContext<TransactionContextType>({
  transactions: [],
  categories: [],
  groups: [],
  addTransaction: async () => {},
  deleteTransaction: async () => {},
  updateTransaction: async () => {},
  getTransactionsByMonth: () => [],
  getGroupTransactions: () => [],
  getPersonalTransactions: () => [],
  addGroup: () => {},
  updateGroup: () => {},
  deleteGroup: () => {},
  getGroupById: () => undefined,
  isLoading: false,
});

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Categories[]>([]);
  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Load transactions
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user) return;
      if (!getToken()) return;
      try {
        setIsLoading(true);
        const loadedTransactions = await api.get(`/transactions`);
        if (!loadedTransactions.data) {
          setIsLoading(false);
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
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        toast({
          title: "Error loading transactions",
          description: error.message,
          variant: "destructive",
        });
        console.error("Failed to load transactions", error);
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
        setIsLoading(true);
        const loadedCategories = await api.get("/categories");
        const categories: Categories[] = loadedCategories.data.map(
          (category: any) => ({
            id: category.id,
            name: category.name,
            type: category.type,
          })
        );
        setCategories(categories);
        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Error loading categories",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        console.error("Failed to load categories", error);
      }
    };
    loadCategories();
  }, [user]);

  // Add new transaction (optimistic)
  const addTransaction = async (
    transaction: Omit<Transaction, "id" | "createdBy">
  ) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticTransaction: Transaction = {
      id: tempId,
      createdBy: user.id,
      date: new Date(),
      ...transaction,
    };
    setTransactions((prev) => [optimisticTransaction, ...prev]);
    // Show success toast immediately
    toast({
      title: `${transaction.type === "expense" ? "Expense" : "Income"} added`,
      description: `${transaction.description} - ₹${transaction.amount}`,
    });

    try {
      const transactionRes = await api.post("/transactions", {
        amount: transaction.amount,
        description: transaction.description,
        categoryName: transaction.category,
        transactionType: transaction.type,
      });

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
      setTransactions((prev) =>
        prev.map((t) => (t.id === tempId ? newTransaction : t))
      );
      // Do NOT show another toast here
    } catch (error) {
      setTransactions((prev) => prev.filter((t) => t.id !== tempId));
      toast({
        title: "Error adding transaction",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Delete transaction (optimistic)
  const deleteTransaction = async (id: string) => {
    const prevTransactions = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    // Show success toast immediately
    toast({
      title: "Transaction deleted",
      description: "The transaction has been deleted successfully",
    });
    try {
      await api.delete(`/transactions/${id}`);
      // Do NOT show another toast here
    } catch (error) {
      setTransactions(prevTransactions);
      toast({
        title: "Error deleting transaction",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
    }
  };

  // Update transaction (optimistic)
  const updateTransaction = async (
    id: string,
    transactionData: Partial<Transaction>
  ) => {
    const prevTransactions = transactions;
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...transactionData } : t
      )
    );
    // Show success toast immediately
    toast({
      title: "Transaction updated",
      description: `${transactionData.description} - ₹${transactionData.amount}`,
    });
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
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === updatedTransaction.id ? { ...updatedTransaction } : t
        )
      );
      // Do NOT show another toast here
    } catch (error) {
      setTransactions(prevTransactions);
      toast({
        title: "Error updating transaction",
        description: error.response?.data?.error || "An error occurred",
        variant: "destructive",
      });
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
    isLoading,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
