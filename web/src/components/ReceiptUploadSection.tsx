import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, X, FileImage, Loader2, Camera } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "@/api/axios";

interface ReceiptUploadSectionProps {
  onDataExtracted?: (data: ExtractedData) => void;
  groupId?: string;
}

interface ExtractedData {
  amount: number;
  description: string;
  category: string;
  date: Date;
}

const ReceiptUploadSection: React.FC<ReceiptUploadSectionProps> = ({
  onDataExtracted,
  groupId,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.type.startsWith("image/")) {
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          setIsProcessed(false);
        } else {
          toast({
            title: "Invalid file type",
            description: "Please select an image file (JPG, PNG, etc.)",
            variant: "destructive",
          });
        }
      }
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsProcessed(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const processReceipt = async (file: File): Promise<ExtractedData> => {
    const data = new FormData();
    data.append("receipt", file);
    try {
      const response = await api.post("/receipts", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status !== 200) {
        throw new Error("Failed to upload receipt image");
      }
      const extractedData: ExtractedData = response.data;
      if (
        !extractedData ||
        !extractedData.amount ||
        !extractedData.date ||
        !extractedData.description ||
        !extractedData.category
      ) {
        throw new Error(
          "Unable to extract valid data from receipt please try again or upload a different image"
        );
      }
      return extractedData;
    } catch (error) {
      throw new Error(
        error ? error.message : "Failed to process receipt. Please try again."
      );
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const extractedData = await processReceipt(selectedFile);
      setIsProcessed(true);

      toast({
        title: "Receipt processed successfully!",
        description: "Data has been extracted and filled in the form.",
      });

      onDataExtracted?.(extractedData);
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "Failed to process the receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearUpload = () => {
    setSelectedFile(null);
    setIsProcessed(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="h-4 w-4 text-gray-600" />
        <Label className="text-sm font-medium text-gray-700">
          Upload Receipt (Optional)
        </Label>
      </div>

      {!selectedFile ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer group"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("receipt-upload")?.click()}
        >
          <div className="transition-all duration-200 group-hover:scale-105">
            <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-gray-500 mb-2 transition-colors" />
            <Label htmlFor="receipt-upload" className="cursor-pointer">
              <p className="text-sm font-medium text-gray-700 mb-1 group-hover:text-gray-800 transition-colors">
                Upload Receipt Image
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Drag and drop or click to select
              </p>
              <Button
                variant="outline"
                type="button"
                size="sm"
                className="text-xs"
              >
                Choose File
              </Button>
            </Label>
            <input
              id="receipt-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FileImage className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium truncate max-w-32">
                  {selectedFile.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUpload}
                disabled={isProcessing}
                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {previewUrl && (
              <div className="border rounded-md overflow-hidden mb-3 shadow-sm">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="w-full h-24 object-contain bg-gray-50"
                />
              </div>
            )}
          </div>

          {!isProcessed && (
            <div className="flex space-x-2">
              <Button
                onClick={handleProcessReceipt}
                disabled={isProcessing}
                size="sm"
                className="flex-1 text-xs"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Extract Data"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={clearUpload}
                disabled={isProcessing}
                size="sm"
                className="text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                Remove
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptUploadSection;
