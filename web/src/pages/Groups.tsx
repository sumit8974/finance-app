
import { useState } from 'react';
import { useTransactions } from '@/context/TransactionContext';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Users, ArrowRight, X } from 'lucide-react';

const Groups = () => {
  const { user } = useAuth();
  const { groups, addGroup } = useTransactions();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Add member to the list
  const handleAddMember = () => {
    if (!memberEmail.trim()) return;
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(memberEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Check if member already exists
    if (members.includes(memberEmail)) {
      setError('This member has already been added');
      return;
    }
    
    setMembers(prev => [...prev, memberEmail]);
    setMemberEmail('');
    setError(null);
  };
  
  // Remove member from the list
  const handleRemoveMember = (email: string) => {
    setMembers(prev => prev.filter(m => m !== email));
  };
  
  // Create new group
  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    addGroup(groupName, members);
    setIsAddDialogOpen(false);
    resetForm();
  };
  
  const resetForm = () => {
    setGroupName('');
    setMemberEmail('');
    setMembers([]);
    setError(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>
      
      {/* Groups list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.length > 0 ? (
          groups.map(group => (
            <Link key={group.id} to={`/groups/${group.id}`} className="block transition-transform hover:scale-[1.01]">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground mb-4">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{group.members.length} members</span>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-primary">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full bg-muted/40 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No Groups Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a group to share expenses with friends, family, or roommates
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Your First Group
            </Button>
          </div>
        )}
      </div>
      
      {/* Create Group Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to share and track expenses with others
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                placeholder="e.g. Roommates, Trip to Japan, Family"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Add Members</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Email address"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddMember}>Add</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter email addresses of people you want to add to this group
              </p>
            </div>
            
            {members.length > 0 && (
              <div className="space-y-2">
                <Label>Members</Label>
                <div className="p-2 border rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="bg-primary/10 text-primary py-1 px-3 rounded-full text-sm flex items-center">
                      {user?.email}
                      <span className="ml-1 text-xs">(you)</span>
                    </div>
                  </div>
                  {members.map(email => (
                    <div key={email} className="flex items-center justify-between mb-2">
                      <div className="bg-muted py-1 px-3 rounded-full text-sm">
                        {email}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveMember(email)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Groups;
