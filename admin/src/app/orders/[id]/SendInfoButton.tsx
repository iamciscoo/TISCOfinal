"use client";

import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";

interface SendInfoButtonProps {
  orderId: string;
  customerEmail: string;
  customerName: string;
}

export function SendInfoButton({ orderId, customerEmail, customerName }: SendInfoButtonProps) {
  const router = useRouter();

  const handleSendInfo = () => {
    const params = new URLSearchParams({
      tab: 'send',
      email: customerEmail,
      name: customerName,
      subject: `Order ${orderId.slice(0, 8)}`
    });
    router.push(`/notifications?${params.toString()}`);
  };

  return (
    <Button 
      onClick={handleSendInfo}
      variant="default"
      size="sm"
      className="rounded-full gap-2 px-4 shadow-sm hover:shadow-md transition-all"
    >
      <Mail className="h-4 w-4" />
      <span className="hidden sm:inline">Send Info</span>
      <span className="sm:hidden">Send</span>
    </Button>
  );
}
