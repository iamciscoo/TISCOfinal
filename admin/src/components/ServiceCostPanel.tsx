"use client";

import { useMemo, useState } from "react";
import {
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { validatePositiveNumber, safeParseNumber, formatNumberForInput } from "@/lib/validation";

interface CostItem {
  id?: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  unit?: string;
}

interface CostPayload {
  service_fee: number;
  discount: number;
  currency: string;
  notes: string | null;
  items: CostItem[];
}

interface ServiceCostPanelProps {
  bookingId: string;
}

const currencyDefault = "TZS";

const numberOrZero = (v: any) => {
  const n = Number(v);
  return isFinite(n) ? n : 0;
};

const toMoney = (n: number, cur: string) => `${cur} ${Math.round(n).toLocaleString()}`;

const ServiceCostPanel = ({ bookingId }: ServiceCostPanelProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<CostItem[]>([]);
  const [serviceFee, setServiceFee] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [currency, setCurrency] = useState<string>(currencyDefault);
  const [notes, setNotes] = useState<string>("");

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + numberOrZero(it.unit_price) * numberOrZero(it.quantity), 0),
    [items]
  );
  const total = useMemo(
    () => Math.max(0, subtotal + numberOrZero(serviceFee) - numberOrZero(discount)),
    [subtotal, serviceFee, discount]
  );

  // Load data when sheet opens
  const onOpenAutoFocus = async (e: Event) => {
    // Prevent focus trap stealing initial focus
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/service-costs/${bookingId}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load costs");
      const data = json?.data || {};
      setItems(Array.isArray(data.items) ? data.items.map((it: any) => ({
        id: it.id ?? null,
        name: String(it.name || ""),
        unit_price: numberOrZero(it.unit_price),
        quantity: numberOrZero(it.quantity || 1),
        unit: String(it.unit || "unit"),
      })) : []);
      setServiceFee(formatNumberForInput(data.service_fee));
      setDiscount(formatNumberForInput(data.discount));
      setCurrency(String(data.currency || currencyDefault).slice(0,3).toUpperCase());
      setNotes(String(data.notes || ""));
    } catch (err) {
      console.error("Failed to fetch service costs", err);
      toast({ title: "Error", description: "Failed to load booking costs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: "", unit_price: 0, quantity: 1, unit: "unit" },
    ]);
  };

  const updateItem = (idx: number, patch: Partial<CostItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSave = async () => {
    setLoading(true);
    try {
      // Basic validation
      for (const it of items) {
        if (!it.name || !it.name.trim()) throw new Error("Each item needs a name");
        if (!(numberOrZero(it.unit_price) >= 0)) throw new Error("Invalid unit price");
        if (!(numberOrZero(it.quantity) > 0)) throw new Error("Quantity must be greater than 0");
      }

      const payload: CostPayload = {
        service_fee: numberOrZero(serviceFee),
        discount: numberOrZero(discount),
        currency: currency.slice(0, 3).toUpperCase(),
        notes: notes.trim() || null,
        items: items.map((it) => ({
          name: it.name.trim(),
          unit_price: numberOrZero(it.unit_price),
          quantity: numberOrZero(it.quantity),
          unit: it.unit || "unit",
        })),
      };

      const res = await fetch(`/api/service-costs/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to save costs");

      toast({ title: "Saved", description: "Booking costs updated" });
      // Reload to refresh totals in table
      window.location.reload();
    } catch (err: any) {
      console.error("Save costs error", err);
      toast({ title: "Error", description: err?.message || "Failed to save costs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SheetContent onOpenAutoFocus={onOpenAutoFocus} className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-lg sm:text-xl">Manage Costs</SheetTitle>
        <SheetDescription className="text-sm">Materials, fees, and totals for this booking.</SheetDescription>
      </SheetHeader>

      {/* Items */}
      <div className="px-3 sm:px-4 space-y-3 sm:space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-base sm:text-lg">Items</h3>
          <Button size="sm" variant="secondary" onClick={addItem} disabled={loading} className="min-h-[44px] sm:min-h-0">Add item</Button>
        </div>
        <div className="space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">No items yet. Add materials/resources used.</p>
          )}
          {items.map((it, idx) => (
            <div key={idx} className="border rounded-lg p-3 sm:p-4 space-y-3 bg-card">
              {/* Mobile: Stack vertically, Desktop: Grid */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Label className="text-xs sm:text-sm font-medium">Name</Label>
                  <Input
                    value={it.name}
                    onChange={(e) => updateItem(idx, { name: e.target.value })}
                    placeholder="e.g. Thermal paste"
                    disabled={loading}
                    className="mt-1 min-h-[44px] sm:min-h-[36px]"
                  />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeItem(idx)} 
                  disabled={loading}
                  className="min-w-[44px] min-h-[44px] sm:min-w-[36px] sm:min-h-[36px] mt-5"
                >
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Unit Price</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formatNumberForInput(it.unit_price)}
                    onChange={(e) => {
                      const validated = validatePositiveNumber(e.target.value);
                      updateItem(idx, { unit_price: safeParseNumber(validated) });
                    }}
                    disabled={loading}
                    placeholder="0"
                    className="mt-1 min-h-[44px] sm:min-h-[36px]"
                  />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium">Qty</Label>
                  <Input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={formatNumberForInput(it.quantity, false)}
                    onChange={(e) => {
                      const validated = validatePositiveNumber(e.target.value);
                      updateItem(idx, { quantity: safeParseNumber(validated, 1) });
                    }}
                    disabled={loading}
                    placeholder="1"
                    className="mt-1 min-h-[44px] sm:min-h-[36px]"
                  />
                </div>
                <div className="col-span-2 sm:col-span-2">
                  <Label className="text-xs sm:text-sm font-medium">Unit</Label>
                  <Input
                    value={it.unit || "unit"}
                    onChange={(e) => updateItem(idx, { unit: e.target.value })}
                    placeholder="unit"
                    disabled={loading}
                    className="mt-1 min-h-[44px] sm:min-h-[36px]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Fees */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <Label className="text-xs sm:text-sm font-medium">Service Fee</Label>
            <Input 
              type="number" 
              min={0} 
              step="0.01" 
              value={serviceFee} 
              onChange={(e) => {
                const validated = validatePositiveNumber(e.target.value);
                setServiceFee(validated);
              }} 
              disabled={loading}
              placeholder="0"
              className="mt-1 min-h-[44px] sm:min-h-[36px]"
            />
          </div>
          <div>
            <Label className="text-xs sm:text-sm font-medium">Discount</Label>
            <Input 
              type="number" 
              min={0} 
              step="0.01" 
              value={discount} 
              onChange={(e) => {
                const validated = validatePositiveNumber(e.target.value);
                setDiscount(validated);
              }} 
              disabled={loading}
              placeholder="0"
              className="mt-1 min-h-[44px] sm:min-h-[36px]"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs sm:text-sm font-medium">Currency</Label>
            <Input 
              maxLength={3} 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value.toUpperCase())} 
              disabled={loading}
              className="mt-1 min-h-[44px] sm:min-h-[36px] w-full sm:w-32"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs sm:text-sm font-medium">Notes</Label>
          <Textarea 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            placeholder="Internal notes (optional)" 
            disabled={loading}
            className="mt-1 min-h-[80px]"
          />
        </div>

        {/* Totals */}
        <div className="bg-secondary rounded-md p-3 sm:p-4 text-sm sm:text-base space-y-2">
          <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{toMoney(subtotal, currency)}</span></div>
          <div className="flex justify-between"><span>+ Service Fee</span><span className="font-medium">{toMoney(numberOrZero(serviceFee), currency)}</span></div>
          <div className="flex justify-between"><span>- Discount</span><span className="font-medium">{toMoney(numberOrZero(discount), currency)}</span></div>
          <Separator className="my-2" />
          <div className="flex justify-between font-semibold text-base sm:text-lg"><span>Total</span><span>{toMoney(total, currency)}</span></div>
        </div>
      </div>

      <SheetFooter className="px-3 sm:px-4 py-3 sm:py-4">
        <Button 
          onClick={onSave} 
          disabled={loading}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </SheetFooter>
    </SheetContent>
  );
};

export default ServiceCostPanel;
