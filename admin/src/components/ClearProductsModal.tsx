"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ClearProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  productCount: number;
}

export function ClearProductsModal({
  open,
  onOpenChange,
  onSuccess,
  productCount,
}: ClearProductsModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const CONFIRM_PHRASE = "DELETE ALL PRODUCTS";
  const isConfirmed = confirmText === CONFIRM_PHRASE;

  const handleClearAll = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/products/clear-all", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete products");
      }

      toast({
        title: "Products Cleared",
        description: `Successfully deleted ${data.deleted} products. Order history has been preserved.`,
        variant: "default",
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset state
      setConfirmText("");
    } catch (error) {
      console.error("Error clearing products:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete products",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Clear All Products?</DialogTitle>
          </div>
          <DialogDescription>
            This action cannot be undone and will permanently delete all products.
          </DialogDescription>
          <div className="pt-4 space-y-3 text-base">
            <p className="font-semibold text-red-600">
              ⚠️ This action cannot be undone!
            </p>
            <p>
              You are about to permanently delete <strong className="text-foreground">{productCount} products</strong> from the database.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md p-3 space-y-2">
              <p className="font-medium text-amber-900 dark:text-amber-100">What will be deleted:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <li>All product information</li>
                <li>Product images and media</li>
                <li>Product categories associations</li>
                <li>Product reviews</li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3 space-y-2">
              <p className="font-medium text-blue-900 dark:text-blue-100">What will be preserved:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                <li>Order history (product references will be nullified)</li>
                <li>Customer data</li>
                <li>Categories (empty categories will remain)</li>
              </ul>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Type <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-red-600 font-mono text-xs">{CONFIRM_PHRASE}</code> to confirm:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type the confirmation phrase"
              className="font-mono text-sm"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearAll}
            disabled={!isConfirmed || isDeleting}
            className="gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Delete All Products
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
