
import { useState, useMemo } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { Button } from "@/components/ui/button";
import { format, subMonths, startOfMonth, addDays, getMonth, getYear } from 'date-fns';
import MonthPicker from '@/components/MonthPicker';
import TabView from '@/components/TabView';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
const Analytics = () => {
  const {
    transactions,
    getTransactionsByMonth,
    groups,
    getGroupTransactions,
    getPersonalTransactions
  } = useTransactions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Get transactions for current month
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyTransactions = getTransactionsByMonth(currentMonth, currentYear);

  // Get personal transactions
  const personalTransactions = getPersonalTransactions();

  // Get group transactions
  const groupTransactions = selectedGroupId ? getGroupTransactions(selectedGroupId) : transactions.filter(t => t.groupId);

  // For pie chart - Expense by category
  const getCategoryData = transactionsList => {
    return transactionsList.filter(t => t.type === 'expense').reduce((acc, transaction) => {
      const existingCategory = acc.find(item => item.name === transaction.category);
      if (existingCategory) {
        existingCategory.value += transaction.amount;
      } else {
        acc.push({
          name: transaction.category,
          value: transaction.amount
        });
      }
      return acc;
    }, [] as {
      name: string;
      value: number;
    }[]).sort((a, b) => b.value - a.value);
  };

  // Expense by category data
  const personalCategoryData = useMemo(() => getCategoryData(personalTransactions), [personalTransactions]);
  const groupCategoryData = useMemo(() => getCategoryData(groupTransactions), [groupTransactions]);

  // For line chart - Monthly spending trend (last 6 months)
  const getMonthlyTrend = transactionsList => {
    const now = new Date();
    const data = [];

    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const month = getMonth(monthDate);
      const year = getYear(monthDate);

      // Filter transactions for this month
      const monthTransactions = transactionsList.filter(t => {
        const date = new Date(t.date);
        return getMonth(date) === month && getYear(date) === year;
      });

      // Calculate total expenses and income
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      data.push({
        month: format(monthDate, 'MMM'),
        expense: expenses,
        income: income,
        savings: income - expenses
      });
    }
    return data;
  };

  // Monthly trend data
  const personalMonthlyTrend = useMemo(() => getMonthlyTrend(personalTransactions), [personalTransactions]);
  const groupMonthlyTrend = useMemo(() => getMonthlyTrend(groupTransactions), [groupTransactions]);

  // For bar chart - Daily spending (current month)
  const getDailySpending = transactionsList => {
    const startOfCurrentMonth = startOfMonth(currentDate);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = addDays(startOfCurrentMonth, day - 1);

      // Filter transactions for this day
      const dayTransactions = transactionsList.filter(t => {
        const date = new Date(t.date);
        return date.getDate() === day && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      const expenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      data.push({
        day: day,
        expense: expenses
      });
    }
    return data;
  };

  // Daily spending data
  const personalDailySpending = useMemo(() => getDailySpending(personalTransactions), [personalTransactions, currentMonth, currentYear]);
  const groupDailySpending = useMemo(() => getDailySpending(groupTransactions), [groupTransactions, currentMonth, currentYear]);

  // Group filter selector
  const groupFilterSelect = <div className="mb-4">
      <Select value={selectedGroupId || "all"} onValueChange={value => setSelectedGroupId(value === "all" ? null : value)}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Select Group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Groups</SelectItem>
          {groups.map(group => <SelectItem key={group.id} value={group.id}>
              {group.name}
            </SelectItem>)}
        </SelectContent>
      </Select>
    </div>;

  // Format for the tooltip value
  const formatTooltipValue = (value: any): string => {
    if (typeof value === 'number') {
      return `$${value.toFixed(2)}`;
    }
    return `$${value}`;
  };
  
  // Custom chart config for consistent styling
  const chartConfig = {
    expense: { color: '#F87171' }, // Red for expenses
    income: { color: '#4ADE80' },  // Green for income
    savings: { color: '#60A5FA' }, // Blue for savings
  };
  
  // Custom pie tooltip formatter
  const renderCustomPieTooltip = (props) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background/90 border border-border p-2 rounded-md shadow-md">
          <p className="font-medium">{`${data.name}: ${formatTooltipValue(data.value)}`}</p>
          <p className="text-muted-foreground">{`(${(data.percent * 100).toFixed(0)}%)`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Custom pie label formatter to prevent overlapping
  const renderCustomPieLabel = ({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
    // Don't render labels for small segments (less than 8%)
    if (percent < 0.08) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.2; // Position labels outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[name.length % COLORS.length]} // Use dynamic color based on name
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Tab content for personal analytics
  const personalTabContent = <div className="space-y-6">
      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={personalMonthlyTrend} margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 20
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Legend wrapperStyle={{ paddingTop: 15 }} />
                <Line type="monotone" dataKey="expense" stroke="#F87171" name="Expenses" strokeWidth={2} />
                <Line type="monotone" dataKey="income" stroke="#4ADE80" name="Income" strokeWidth={2} />
                <Line type="monotone" dataKey="savings" stroke="#60A5FA" name="Savings" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Category and Daily Spending Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]"> {/* Increased height for better readability */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                  <Pie 
                    data={personalCategoryData} 
                    cx="50%" 
                    cy="45%" 
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="value" 
                    nameKey="name" 
                    label={renderCustomPieLabel}
                    labelLine={false}
                  >
                    {personalCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderCustomPieTooltip} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: 20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Spending for {format(currentDate, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]"> {/* Matching height with other chart */}
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personalDailySpending} margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 20
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Expenses']} />
                  <Bar dataKey="expense" fill="#F87171" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;

  // Tab content for group analytics - use same styling improvements
  const groupTabContent = <div className="space-y-6">
      {groupFilterSelect}
      
      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Group Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={groupMonthlyTrend} margin={{
              top: 10,
              right: 30,
              left: 20,
              bottom: 20
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Legend wrapperStyle={{ paddingTop: 15 }} />
                <Line type="monotone" dataKey="expense" stroke="#F87171" name="Expenses" strokeWidth={2} />
                <Line type="monotone" dataKey="income" stroke="#4ADE80" name="Income" strokeWidth={2} />
                <Line type="monotone" dataKey="savings" stroke="#60A5FA" name="Savings" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Category and Daily Spending Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense by Category Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Group Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
                  <Pie 
                    data={groupCategoryData} 
                    cx="50%" 
                    cy="45%" 
                    outerRadius={80} 
                    fill="#8884d8" 
                    dataKey="value" 
                    nameKey="name" 
                    label={renderCustomPieLabel}
                    labelLine={false}
                  >
                    {groupCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderCustomPieTooltip} />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: 20 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Group Spending for {format(currentDate, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupDailySpending} margin={{
                top: 10,
                right: 30,
                left: 20,
                bottom: 20
              }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Expenses']} />
                  <Bar dataKey="expense" fill="#F87171" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;

  // Define tabs
  const tabs = [{
    value: "personal",
    label: "Personal",
    content: personalTabContent
  }, {
    value: "group",
    label: "Group",
    content: groupTabContent
  }];
  return <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <MonthPicker date={currentDate} onChange={setCurrentDate} />
      </div>
      
      <TabView tabs={tabs} />
    </div>;
};
export default Analytics;
