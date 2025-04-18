import React from 'react';
import { format } from 'date-fns';
import { FileEdit, Trash2, Share, MessageCircle, Heart, MapPin } from 'lucide-react';
import { Memory } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MemoryForm from './memory-form';

interface MemoryCardProps {
  memory: Memory;
  user?: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MemoryCard({ memory, user, onEdit, onDelete }: MemoryCardProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const isOwner = currentUser?.id === memory.userId;
  const memoryDate = new Date(memory.date);
  
  // Delete mutation
  const deleteMemoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/memories/${memory.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Memory deleted",
        description: "Your memory has been successfully deleted."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      if (onDelete) onDelete();
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete memory",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Getting the primary image to display
  const primaryImage = memory.images && memory.images.length > 0 ? memory.images[0] : null;

  // Handle like, comment, share, etc.
  const handleLike = () => {
    toast({
      title: "Liked",
      description: "You liked this memory"
    });
  };

  const handleShare = () => {
    toast({
      title: "Shared",
      description: "Memory shared successfully"
    });
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 flex flex-row items-center gap-3 space-y-0">
          <Avatar>
            <AvatarImage src={user?.avatar || ""} alt={user?.displayName || user?.username} />
            <AvatarFallback>
              {user?.username?.substring(0, 2).toUpperCase() || "UN"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-medium">{user?.displayName || user?.username}</div>
            <div className="text-xs text-muted-foreground flex items-center">
              {format(memoryDate, 'MMMM d, yyyy')}
              {memory.location && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin className="h-3 w-3 mr-1" />
                  {memory.location}
                </>
              )}
            </div>
          </div>
          
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <FileEdit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <AlertDialogTrigger asChild onClick={() => setDeleteDialogOpen(true)}>
                  <DropdownMenuItem className="text-red-500">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        
        {primaryImage && (
          <div className="relative aspect-video w-full overflow-hidden">
            <img 
              src={primaryImage} 
              alt={memory.title} 
              className="object-cover w-full h-full"
            />
          </div>
        )}
        
        <CardContent className="p-4">
          <h3 className="text-lg font-medium">{memory.title}</h3>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{memory.content}</p>
          
          {memory.images && memory.images.length > 1 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {memory.images.slice(1, 4).map((image, index) => (
                <div key={index} className="aspect-square rounded-md overflow-hidden">
                  <img 
                    src={image} 
                    alt={`${memory.title} ${index + 2}`}
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
              {memory.images.length > 4 && (
                <div className="aspect-square rounded-md overflow-hidden relative bg-slate-900 flex items-center justify-center text-white font-medium">
                  +{memory.images.length - 4}
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleLike}>
              <Heart className="mr-1 h-4 w-4" />
              Like
            </Button>
            <Button variant="ghost" size="sm">
              <MessageCircle className="mr-1 h-4 w-4" />
              Comment
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share className="mr-1 h-4 w-4" />
            Share
          </Button>
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <MemoryForm 
            memory={memory} 
            onSuccess={() => {
              setEditDialogOpen(false);
              if (onEdit) onEdit();
            }} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the memory
              and remove it from all groups it is shared with.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMemoryMutation.mutate()}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMemoryMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default MemoryCard;
