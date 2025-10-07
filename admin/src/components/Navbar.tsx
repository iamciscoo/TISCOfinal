"use client";

import { LogOut, Moon, Settings, Sun, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";

const Navbar = () => {
  const { setTheme } = useTheme();
  return (
    <nav className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border z-50">
      {/* LEFT */}
      <div className="flex items-center gap-2 sm:gap-3">
        <SidebarTrigger className="h-9 w-9 sm:h-8 sm:w-8 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0" />
      </div>
      {/* RIGHT */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <Link href="/" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-flex">
          Dashboard
        </Link>
        {/* THEME MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 min-h-[44px] sm:min-h-0 min-w-[44px] sm:min-w-0">
              <Sun className="h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.1rem] w-[1.1rem] sm:h-[1.2rem] sm:w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
