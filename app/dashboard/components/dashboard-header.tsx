'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Activity,
  Server,
  Database
} from 'lucide-react';

interface DashboardHeaderProps {
  user: {
    email: string;
    display_name?: string | null;
    role: string;
  };
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const initials = user.display_name
    ? user.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <header className="border-b bg-white dark:bg-gray-800 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Server className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold">Server Monitor</h1>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <nav className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-blue-600 bg-blue-50 dark:bg-blue-950"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href="/events" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Events
              </a>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="capitalize">
            <Database className="h-3 w-3 mr-1" />
            {user.role}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.display_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <form action="/api/auth/local/logout" method="POST" className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center text-red-600 dark:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
