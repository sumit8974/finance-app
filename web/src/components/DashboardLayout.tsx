
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ListOrdered, 
  BarChart, 
  Users, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useIsMobile } from '@/hooks/use-mobile';
import AddTransactionDialog from './AddTransactionDialog';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const isMobile = useIsMobile();
  const isGroupEnabled = import.meta.env.VITE_IS_GROUP_ENABLED === 'true';
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', href: '/transactions', icon: ListOrdered },
    { name: 'Analytics', href: '/analytics', icon: BarChart },
    isGroupEnabled ? { name: 'Groups', href: '/groups', icon: Users } : null,
  ].filter(Boolean);

  const currentPath = location.pathname;
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-sidebar border-r pt-5 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6">
            <h1 className="text-xl font-bold text-primary">FinTracker</h1>
          </div>
          
          <div className="mt-8 flex-1 flex flex-col justify-between">
            <nav className="flex-1 px-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPath.includes(item.href)
                      ? 'bg-primary text-white'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>
            
            <div className="p-4 space-y-4">
              <Button
                onClick={() => setIsAddTransactionOpen(true)}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
              
              <div className="flex items-center justify-between px-2">
                <ThemeSwitcher />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1 h-auto">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{getInitials(user?.name || '')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <p>{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background z-10 border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl font-bold text-primary">FinTracker</h1>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeSwitcher />
            
            <Button
              variant="outline" 
              size="icon"
              onClick={() => setIsAddTransactionOpen(true)}
              className="rounded-full"
            >
              <PlusCircle className="h-5 w-5" />
            </Button>
            
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <nav className="space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center px-3 py-3 text-base font-medium rounded-md transition-colors ${
                          currentPath.includes(item.href)
                            ? 'bg-primary text-white'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent'
                        }`}
                        onClick={closeMobileMenu}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="mt-auto pt-4 border-t">
                    <div className="flex items-center px-3 py-2">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback>{getInitials(user?.name || '')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-medium">{user?.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-2"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1 py-6 px-4 sm:px-6 md:px-8 mt-16 md:mt-0">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      
      {/* Add Transaction Dialog */}
      <AddTransactionDialog 
        open={isAddTransactionOpen} 
        onOpenChange={setIsAddTransactionOpen} 
      />
    </div>
  );
};

export default DashboardLayout;
