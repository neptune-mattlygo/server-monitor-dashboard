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
import { ThemeToggle } from '@/components/theme-toggle';
import { usePathname } from 'next/navigation';
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  Activity,
  Server,
  Database,
  Shield,
  AlertCircle,
  Users,
  MapPin,
  Palette,
  ExternalLink,
  Bell
} from 'lucide-react';
import { useLogo } from '@/lib/hooks/use-logo';
import Image from 'next/image';

interface DashboardHeaderProps {
  user: {
    email: string;
    display_name?: string | null;
    role: string;
  };
  isAdmin?: boolean;
}

export function DashboardHeader({ user, isAdmin = false }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { logo } = useLogo();
  
  const initials = user.display_name
    ? user.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : user.email[0].toUpperCase();

  const isDashboard = pathname === '/dashboard';
  const isEvents = pathname === '/events';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-950/95 dark:supports-[backdrop-filter]:bg-gray-950/60 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {logo ? (
              <div className="relative h-10 flex items-center">
                <Image
                  src={logo.url}
                  alt="Site logo"
                  width={150}
                  height={40}
                  className="h-10 w-auto object-contain max-h-10"
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-xl shadow-md">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Server Monitor
                  </h1>
                  <p className="text-xs text-muted-foreground">Real-time Dashboard</p>
                </div>
              </>
            )}
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          <nav className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={`transition-all duration-200 ${
                isDashboard 
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 shadow-sm" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </a>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className={`transition-all duration-200 ${
                isEvents 
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 shadow-sm" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <a href="/events" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Events
              </a>
            </Button>
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-950/50 dark:hover:to-blue-950/50 transition-all duration-200">
                    <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-700 dark:text-purple-300">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur">
                  <DropdownMenuLabel className="text-purple-600 dark:text-purple-400 font-semibold">Status Page Admin</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="hover:bg-blue-50 dark:hover:bg-blue-950/50">
                    <a href="/dashboard/admin/incidents" className="cursor-pointer">
                      <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                      <span className="text-gray-700 dark:text-gray-300">Incidents</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-green-50 dark:hover:bg-green-950/50">
                    <a href="/dashboard/admin/clients" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-gray-700 dark:text-gray-300">Clients & Subscribers</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-orange-50 dark:hover:bg-orange-950/50">
                    <a href="/dashboard/admin/regions" className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4 text-orange-500" />
                      <span className="text-gray-700 dark:text-gray-300">Regions</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-pink-50 dark:hover:bg-pink-950/50">
                    <a href="/dashboard/admin/config" className="cursor-pointer">
                      <Palette className="mr-2 h-4 w-4 text-pink-500" />
                      <span className="text-gray-700 dark:text-gray-300">Configuration</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-emerald-600 dark:text-emerald-400 font-semibold">Monitoring</DropdownMenuLabel>
                  <DropdownMenuItem asChild className="hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                    <a href="/dashboard/admin/backup-monitoring" className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4 text-emerald-500" />
                      <span className="text-gray-700 dark:text-gray-300">Backup Monitoring</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
                    <a href="/dashboard/admin/users" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4 text-indigo-500" />
                      <span className="text-gray-700 dark:text-gray-300">User Management</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="hover:bg-gray-50 dark:hover:bg-gray-950/50">
                    <a href="/dashboard/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">Settings</span>
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
          
          <Separator orientation="vertical" className="h-8" />
          
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex items-center gap-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-950 transition-all duration-200 shadow-sm"
          >
            <a href="/status" target="_blank" rel="noopener noreferrer">
              <AlertCircle className="h-4 w-4" />
              Status Page
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <Badge variant="outline" className="capitalize bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 dark:from-gray-800 dark:to-gray-900 dark:border-gray-700 shadow-sm">
            <Database className="h-3 w-3 mr-1 text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">{user.role}</span>
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:shadow-md transition-all duration-200">
                <Avatar className="h-10 w-10 border-2 border-gradient-to-br from-blue-400 to-purple-500 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white font-semibold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 shadow-lg border-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-t-lg">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
                    {user.display_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                  <Badge variant="secondary" className="w-fit text-xs px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {user.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="hover:bg-blue-50 dark:hover:bg-blue-950/50">
                <a href="/profile" className="cursor-pointer flex items-center p-3">
                  <User className="mr-3 h-4 w-4 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="hover:bg-gray-50 dark:hover:bg-gray-950/50">
                <a href="/settings" className="cursor-pointer flex items-center p-3">
                  <Settings className="mr-3 h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Settings</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="hover:bg-red-50 dark:hover:bg-red-950/50">
                <a
                  href="/logout"
                  className="flex w-full items-center p-3 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-red-600 dark:text-red-400">Sign Out</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
