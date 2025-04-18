import * as React from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { UploadCloud, X } from "lucide-react";

export interface FileUploadProps extends React.HTMLAttributes<HTMLDivElement> {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  accept?: Record<string, string[]>;
  maxSize?: number;
  value?: File[];
  previewImages?: boolean;
}

export function FileUpload({
  className,
  onFilesSelected,
  multiple = false,
  maxFiles = 5,
  accept = {
    'image/*': []
  },
  maxSize = 5 * 1024 * 1024, // 5MB default
  value = [],
  previewImages = true,
  ...props
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>(value);
  const [previews, setPreviews] = React.useState<string[]>([]);

  React.useEffect(() => {
    // Create preview URLs for images
    if (previewImages && files.length > 0) {
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
      
      // Clean up URLs when component unmounts
      return () => {
        newPreviews.forEach(preview => URL.revokeObjectURL(preview));
      };
    }
  }, [files, previewImages]);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const newFiles = multiple 
      ? [...files, ...acceptedFiles].slice(0, maxFiles)
      : acceptedFiles.slice(0, 1);
    
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, multiple, maxFiles, onFilesSelected]);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    onFilesSelected(newFiles);
    
    if (previewImages && previews[index]) {
      URL.revokeObjectURL(previews[index]);
      const newPreviews = [...previews];
      newPreviews.splice(index, 1);
      setPreviews(newPreviews);
    }
  };

  const { 
    getRootProps, 
    getInputProps, 
    isDragActive,
    isDragAccept,
    isDragReject 
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    maxFiles
  });

  return (
    <div className={cn("space-y-4", className)} {...props}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2",
          isDragActive && "border-primary bg-primary/10",
          isDragAccept && "border-green-500 bg-green-500/10",
          isDragReject && "border-red-500 bg-red-500/10",
          !isDragActive && "border-border hover:border-primary/50 hover:bg-accent"
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">
            {isDragActive
              ? "Drop files here..."
              : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {multiple
              ? `Upload up to ${maxFiles} images (max ${maxSize / (1024 * 1024)}MB each)`
              : `Upload an image (max ${maxSize / (1024 * 1024)}MB)`}
          </p>
        </div>
      </div>

      {/* Preview area */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative group">
              {previewImages && file.type.startsWith('image/') ? (
                <div className="relative aspect-square rounded-md overflow-hidden border bg-muted">
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="h-full w-full object-cover transition-opacity group-hover:opacity-50"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center aspect-square rounded-md border bg-muted p-2">
                  <p className="text-xs truncate max-w-full">{file.name}</p>
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
