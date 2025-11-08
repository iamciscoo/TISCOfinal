"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { downloadServiceBookingReceipt } from "@/lib/service-booking-receipt-generator";

interface ServiceCostItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  unit: string;
}

interface ServiceCosts {
  id: string;
  service_fee: number;
  discount: number;
  currency: string;
  subtotal: number;
  total: number;
  notes: string | null;
  items: ServiceCostItem[];
}

interface DownloadReceiptButtonProps {
  booking: any; // The booking data already loaded on the page
  serviceCosts: ServiceCosts | null;
}

export default function DownloadReceiptButton({ booking, serviceCosts }: DownloadReceiptButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    
    try {
      console.log('Generating receipt with data:', {
        hasBooking: !!booking,
        hasServiceCosts: !!serviceCosts,
        itemsCount: serviceCosts?.items?.length || 0,
        subtotal: serviceCosts?.subtotal,
        serviceFee: serviceCosts?.service_fee,
        discount: serviceCosts?.discount,
        total: serviceCosts?.total
      });
      
      await downloadServiceBookingReceipt({
        booking,
        serviceCosts
      });
      
      toast({ 
        title: "Success",
        description: "Receipt downloaded successfully"
      });
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast({ 
        title: "Error",
        description: "Failed to download receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      className="min-h-[44px] sm:min-h-[36px]"
      onClick={handleDownloadReceipt}
      disabled={isDownloading}
    >
      <Download className="h-4 w-4 mr-2" />
      {isDownloading ? "Generating..." : "Download Receipt"}
    </Button>
  );
}
