"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandAutocompleteProps {
  value: string[];
  onChange: (brands: string[]) => void;
  placeholder?: string;
}

export function BrandAutocomplete({ value, onChange, placeholder = "Enter brand name" }: BrandAutocompleteProps) {
  const [brandInput, setBrandInput] = useState("");
  const [allBrands, setAllBrands] = useState<string[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await fetch("/api/brands");
        const json = await res.json();
        if (res.ok && json.data) {
          setAllBrands(json.data);
        }
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };
    fetchBrands();
  }, []);

  // Filter brands based on input
  useEffect(() => {
    if (brandInput.trim()) {
      const searchTerm = brandInput.toLowerCase();
      const filtered = allBrands.filter(
        (brand) =>
          brand.toLowerCase().includes(searchTerm) &&
          !value.includes(brand)
      );
      setFilteredBrands(filtered);
      setShowDropdown(filtered.length > 0);
      setHighlightedIndex(-1);
    } else {
      setFilteredBrands([]);
      setShowDropdown(false);
    }
  }, [brandInput, allBrands, value]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddBrand = (brandName?: string) => {
    const trimmedBrand = (brandName || brandInput).trim();
    if (!trimmedBrand) return;

    const currentBrands = value || [];
    if (!currentBrands.includes(trimmedBrand)) {
      onChange([...currentBrands, trimmedBrand]);
      setBrandInput("");
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  const handleRemoveBrand = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      // If dropdown is open and item is highlighted, select it
      if (showDropdown && highlightedIndex >= 0 && filteredBrands[highlightedIndex]) {
        handleAddBrand(filteredBrands[highlightedIndex]);
      } else {
        // Otherwise add as new brand
        handleAddBrand();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showDropdown) {
        setHighlightedIndex((prev) =>
          prev < filteredBrands.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showDropdown) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={brandInput}
              onChange={(e) => setBrandInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (filteredBrands.length > 0) {
                  setShowDropdown(true);
                }
              }}
              placeholder={placeholder}
              className="pr-8"
            />
            {brandInput && (
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            )}
          </div>
          <Button
            type="button"
            onClick={() => handleAddBrand()}
            variant="outline"
            className="shrink-0"
          >
            Add
          </Button>
        </div>

        {/* Dropdown */}
        {showDropdown && filteredBrands.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {filteredBrands.map((brand, index) => (
              <button
                key={brand}
                type="button"
                onClick={() => handleAddBrand(brand)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                  highlightedIndex === index && "bg-accent text-accent-foreground"
                )}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {brand}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected brands */}
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((brand, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {brand}
              <button
                type="button"
                className="ml-1 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleRemoveBrand(index);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
