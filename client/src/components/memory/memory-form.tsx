import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertMemorySchema, Memory } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FileUpload } from "@/components/ui/file-upload";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Extend the schema with validation
const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  date: z.coerce.date(),
  location: z.string().optional(),
  isPrivate: z.boolean().default(false),
  userId: z.number().optional(),
  // We'll handle images separately since they're files
});

type MemoryFormProps = {
  memory?: Memory;
  onSuccess?: () => void;
};

export function MemoryForm({ memory, onSuccess }: MemoryFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: memory
      ? {
          ...memory,
          date: new Date(memory.date),
        }
      : {
          title: "",
          content: "",
          date: new Date(),
          location: "",
          isPrivate: false,
          userId: user?.id,
        },
  });

  // Create mutation
  const createMemoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // First we need to upload the images if there are any
      let imageUrls: string[] = [];
      
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        
        if (!uploadRes.ok) {
          const error = await uploadRes.text();
          throw new Error(`Failed to upload images: ${error}`);
        }
        
        const uploadData = await uploadRes.json();
        imageUrls = uploadData.urls;
      }
      
      // Keep the existing images if we're editing and add new ones
      if (memory?.images) {
        imageUrls = [...memory.images, ...imageUrls];
      }
      
      // Make sure the date is properly formatted as a Date object
      const memoryData = {
        ...data,
        userId: user?.id,
        images: imageUrls,
        // Ensure date is sent as a Date object that can be properly serialized
        date: data.date instanceof Date ? data.date : new Date(data.date),
      };
      
      if (memory) {
        // Update existing memory
        const res = await apiRequest("PUT", `/api/memories/${memory.id}`, memoryData);
        return await res.json();
      } else {
        // Create new memory
        const res = await apiRequest("POST", "/api/memories", memoryData);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: memory ? "Memory updated" : "Memory created",
        description: memory 
          ? "Your memory has been updated successfully!" 
          : "Your memory has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/memories'] });
      if (onSuccess) onSuccess();
      form.reset();
      setUploadedFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: memory ? "Failed to update memory" : "Failed to create memory",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    createMemoryMutation.mutate(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a title for your memory" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What's this memory about?" 
                  className="min-h-[120px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Add a location (optional)" 
                      className="pl-10"
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Private Memory</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Only you will be able to see this memory
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Images</FormLabel>
          <FileUpload
            multiple
            maxFiles={5}
            accept={{
              'image/*': []
            }}
            onFilesSelected={setUploadedFiles}
            value={uploadedFiles}
            previewImages
          />
          {memory?.images && memory.images.length > 0 && (
            <div className="mt-2">
              <div className="text-sm text-slate-500 mb-2">Existing Images</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {memory.images.map((image, index) => (
                  <div key={index} className="relative aspect-square overflow-hidden rounded border">
                    <img
                      src={image}
                      alt={`Existing image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMemoryMutation.isPending}>
            {createMemoryMutation.isPending
              ? "Saving..."
              : memory 
                ? "Update Memory" 
                : "Create Memory"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default MemoryForm;
