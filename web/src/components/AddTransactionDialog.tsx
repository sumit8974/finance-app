import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { useTransactions, Transaction } from "@/context/TransactionContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGroupId?: string;
  editTransaction?: Transaction | null;
}

const AddTransactionDialog: React.FC<AddTransactionDialogProps> = ({
  open,
  onOpenChange,
  initialGroupId,
  editTransaction,
}) => {
  const { addTransaction, updateTransaction, groups, categories } =
    useTransactions();

  // Form state
  const [formState, setFormState] = useState({
    type: "expense" as "expense" | "income",
    amount: "",
    description: "",
    category: "",
    date: new Date(),
    groupId: initialGroupId || undefined,
  });

  // Track if we're in edit mode
  const [isEditMode, setIsEditMode] = useState(false);

  // This effect runs when the dialog opens/closes or when editTransaction changes
  useEffect(() => {
    if (open) {
      if (editTransaction) {
        // We're editing an existing transaction - set up the form
        setFormState({
          type: editTransaction.type,
          amount: editTransaction.amount.toString(),
          description: editTransaction.description,
          category: editTransaction.category.toString(),
          date: new Date(editTransaction.date),
          groupId: editTransaction.groupId,
        });
        setIsEditMode(true);
      } else {
        // New transaction - set up a fresh form with default values
        resetForm();
        setIsEditMode(false);
      }
    }
  }, [open, editTransaction, initialGroupId]);

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset form to default state
  const resetForm = () => {
    setFormState({
      type: "expense",
      amount: "",
      description: "",
      category: "",
      date: new Date(),
      groupId: initialGroupId || undefined,
    });
    setIsEditMode(false);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!formState.amount || !formState.description || !formState.category) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    // Prepare transaction data
    const transactionData = {
      amount: parseFloat(formState.amount),
      description: formState.description,
      category: formState.category,
      date: formState.date,
      type: formState.type,
      groupId: formState.groupId,
    };

    // Either update existing transaction or create a new one
    if (isEditMode && editTransaction) {
      updateTransaction(editTransaction.id, transactionData);
      toast({
        title: "Transaction updated",
        description: `${formState.description} has been updated successfully`,
      });
    } else {
      addTransaction(transactionData);
      toast({
        title: "Transaction added",
        description: `${formState.description} has been added successfully`,
      });
    }

    // Important: First close dialog, then reset state
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // When dialog is closing
          onOpenChange(false);
        } else {
          // When dialog is opening
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Tabs
            defaultValue={formState.type}
            value={formState.type}
            onValueChange={(value) =>
              handleFormChange("type", value as "expense" | "income")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-4 pt-4">
              {/* Expense form fields */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formState.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                    className="pl-8"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  placeholder="What was this expense for?"
                  value={formState.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={formState.category}
                  onValueChange={(value) => handleFormChange("category", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(
                      (cat) =>
                        cat.type === "expense" && (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="income" className="space-y-4 pt-4">
              {/* Income form fields */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-amount" className="text-right">
                  Amount
                </Label>
                <div className="col-span-3 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">
                    ₹
                  </span>
                  <Input
                    id="income-amount"
                    type="number"
                    placeholder="0.00"
                    value={formState.amount}
                    onChange={(e) => handleFormChange("amount", e.target.value)}
                    className="pl-8"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="income-description"
                  placeholder="What was this income from?"
                  value={formState.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="income-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={formState.category}
                  onValueChange={(value) => handleFormChange("category", value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(
                      (cat) =>
                        cat.type === "income" && (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common fields */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formState.date ? (
                      format(formState.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formState.date}
                    onSelect={(date) => date && handleFormChange("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="group" className="text-right">
              Group
            </Label>
            <Select
              value={formState.groupId || "no-group"}
              onValueChange={(val) =>
                handleFormChange(
                  "groupId",
                  val === "no-group" ? undefined : val
                )
              }
              disabled={!!initialGroupId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Personal (No group)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-group">Personal (No group)</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit">
              {isEditMode ? "Update" : "Add"} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTransactionDialog;
