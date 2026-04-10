import { Link, useLocation } from "wouter";
import { Home, Search, PlusSquare, Heart, User, LogOut, Menu, Sun, Moon, Clapperboard, MessageCircle, Compass, Settings, AtSign, FileText, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const logo = "/assets/novii_app_logo.png";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect, useRef } from "react";
import SuggestionsSidebar from "./suggestions-sidebar";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/hooks/use-data";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { OfficialBadge } from "@/components/ui/official-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  // Track user online status globally
  useOnlineStatus();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, direction } = useLanguage();
  const t = getTranslation(language.code).nav;
  const [mounted, setMounted] = useState(false);
  const { signOut, user } = useAuth();
  const { data: notifications } = useNotifications();
  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [createType, setCreateType] = useState<'story' | 'post' | 'reel' | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  
  // Fetch profile data to get username from database
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => api.getCurrentProfile(),
    enabled: !!user,
    staleTime: 0,  // Always refetch when profile changes
  });

  // Get userId from URL when on /user page
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlUserId = searchParams.get('id');

  // Fetch profile for other user when on /user page
  const { data: visitedUserProfile } = useQuery({
    queryKey: ['profile', urlUserId],
    queryFn: () => api.getProfileById(urlUserId!),
    enabled: !!urlUserId && location.startsWith('/user'),
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for chat selection changes to hide bottom nav in mobile
  useEffect(() => {
    const handleStorageChange = () => {
      setChatActive(localStorage.getItem('chatActive') === 'true');
    };
    handleStorageChange(); // Check on mount
    window.addEventListener('storage', handleStorageChange);
    // Also listen to messages from same tab
    const interval = setInterval(handleStorageChange, 100);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const NavItem = ({ href, icon: Icon, label, isActive, badge, onClick, onDoubleClick }: { href?: string, icon: any, label: string, isActive?: boolean, badge?: number, onClick?: () => void, onDoubleClick?: () => void }) => {
    const content = (
      <div 
        onDoubleClick={onDoubleClick}
        className={cn(
          "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-accent/50 relative cursor-pointer justify-center md:justify-start w-full",
          isSidebarExpanded && "md:justify-start",
          !isSidebarExpanded && "md:justify-center",
          isActive ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"
        )}>
        <Icon 
          className={cn(
            "w-6 h-6 transition-transform duration-200 group-hover:scale-110 flex-shrink-0", 
            isActive && "stroke-[3px] text-primary"
          )} 
        />
        <span className={cn(
          "text-md transition-opacity duration-300 whitespace-nowrap",
          isSidebarExpanded ? "opacity-100" : "opacity-0 hidden"
        )}>{label}</span>
        {badge && (
          <span className={cn(
            "absolute flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-in zoom-in transition-all duration-300",
            isSidebarExpanded ? "right-2 md:right-4" : "right-0"
          )}>
            {badge}
          </span>
        )}
      </div>
    );

    if (onClick) {
      return (
        <button
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick?.();
            }
          }}
          className="w-full text-left bg-transparent border-none cursor-pointer p-0"
          aria-label={label}
          type="button"
        >
          {content}
        </button>
      );
    }

    return (
      <div className="w-full">
        <Link href={href || '/'}>
          {content}
        </Link>
      </div>
    );
  };

  // Determine if we should show the mobile header
  // We hide it on Reels, Messages, Settings for a more immersive/native feel if desired, or just keep it simple.
  // Let's keep it simple: Show mobile header on Home, Explore, Notifications. Hide on others if they have their own headers.
  const hasOwnHeader = location === '/messages' || location === '/settings' || location === '/reels' || location === '/mentions';
  const isHome = location === '/';

  return (
    <div 
      className="h-screen bg-background text-foreground flex flex-col lg:flex-row justify-center transition-colors duration-300 overflow-hidden"
      dir={direction}
    >
      
      {/* Navigation Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={cn(
          "order-1 hidden lg:flex flex-col h-screen sticky top-0 z-50 border-e border-border/40 transition-all duration-300 ease-in-out overflow-hidden",
          isSidebarExpanded ? "w-72 p-6" : "w-20 p-3"
        )}
      >
        <div className={cn(
          "mb-10 px-2 flex items-center gap-3 transition-all duration-300",
          isSidebarExpanded ? "justify-start" : "justify-center"
        )}>
            <img src={logo} alt="Novii" className="w-8 h-8 rounded-xl shadow-lg shadow-primary/20 flex-shrink-0" />
            <span className={cn(
              "font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent transition-opacity duration-300",
              isSidebarExpanded ? "block opacity-100" : "hidden opacity-0"
            )}>Novii</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem 
            href="/" 
            icon={Home} 
            label={t.home} 
            isActive={location === "/"} 
            onDoubleClick={() => window.dispatchEvent(new CustomEvent('doubleClickHome'))}
          />
          <NavItem href="/search" icon={Search} label={t.search} isActive={location === "/search"} />
          <NavItem href="/explore" icon={Compass} label={t.explore} isActive={location === "/explore"} />
          <NavItem href="/reels" icon={Clapperboard} label={t.reels} isActive={location === "/reels"} />
          <NavItem href="/messages" icon={MessageCircle} label={t.messages} />
          <NavItem href="/notifications" icon={Heart} label={t.notifications} badge={unreadCount > 0 ? unreadCount : undefined} />
          <NavItem href="/mentions" icon={AtSign} label={'Mentions'} isActive={location === "/mentions"} />
          <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button ref={createButtonRef} className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group hover:bg-accent/50 relative cursor-pointer justify-center md:justify-start",
                isSidebarExpanded && "md:justify-start",
                !isSidebarExpanded && "md:justify-center"
              )}>
                <PlusSquare className="w-6 h-6 transition-transform duration-200 group-hover:scale-110 flex-shrink-0 text-muted-foreground hover:text-foreground" />
                <span className={cn(
                  "text-md transition-opacity duration-300 whitespace-nowrap text-muted-foreground",
                  isSidebarExpanded ? "opacity-100" : "opacity-0 hidden"
                )}>{t.create}</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSidebarExpanded ? "start" : "center"} className="w-56">
              <DropdownMenuItem onClick={() => {
                setCreateType('post');
                setCreateMenuOpen(false);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openPostModal'));
                }, 100);
              }} className="flex items-center gap-3 py-3 px-4 cursor-pointer">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">{language.code === 'ar' ? 'منشور' : 'Post'}</span>
                  <span className="text-xs text-muted-foreground">{language.code === 'ar' ? 'صورة أو صور' : 'Share photos'}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setCreateType('reel');
                setCreateMenuOpen(false);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openReelModal'));
                }, 100);
              }} className="flex items-center gap-3 py-3 px-4 cursor-pointer">
                <Video className="w-5 h-5 text-red-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">{language.code === 'ar' ? 'ريلز' : 'Reel'}</span>
                  <span className="text-xs text-muted-foreground">{language.code === 'ar' ? 'فيديو قصير' : 'Share video'}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setCreateType('story');
                setCreateMenuOpen(false);
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('openStoryModal'));
                }, 100);
              }} className="flex items-center gap-3 py-3 px-4 cursor-pointer">
                <ImageIcon className="w-5 h-5 text-purple-500" />
                <div className="flex flex-col">
                  <span className="font-semibold">{language.code === 'ar' ? 'استوري' : 'Story'}</span>
                  <span className="text-xs text-muted-foreground">{language.code === 'ar' ? 'قصة سريعة' : 'Quick story'}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NavItem 
            href="/profile" 
            icon={User} 
            label={t.profile} 
            isActive={location === "/profile"} 
            onDoubleClick={() => window.dispatchEvent(new CustomEvent('doubleClickProfile'))}
          />
          <NavItem href="/settings" icon={Settings} label={t.settings} isActive={location === "/settings"} />
        </nav>

        <div className="mt-auto space-y-4">
             <div className={cn(
              "px-2 flex transition-all duration-300",
              isSidebarExpanded ? "justify-start" : "justify-center"
            )}>
                <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-full w-fit">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("rounded-full h-8 w-8", theme === 'light' && "bg-background shadow-sm")}
                        onClick={() => setTheme('light')}
                    >
                        <Sun className="w-4 h-4" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn("rounded-full h-8 w-8", theme === 'dark' && "bg-background shadow-sm")}
                        onClick={() => setTheme('dark')}
                    >
                        <Moon className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Button 
                variant="ghost" 
                className={cn(
                  "w-full gap-4 text-muted-foreground hover:text-destructive transition-all duration-300",
                  isSidebarExpanded ? "justify-start" : "justify-center"
                )}
                data-testid="button-logout"
                onClick={handleLogout}
            >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className={cn(
                  "transition-opacity duration-300 whitespace-nowrap",
                  isSidebarExpanded ? "opacity-100" : "opacity-0 hidden"
                )}>{t.logout}</span>
            </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={cn(
        "order-2 flex-1 w-full border-x border-border/40 h-full overflow-y-auto overflow-x-hidden transition-colors duration-300",
        !chatActive && "pb-20 md:pb-0",
      )}>
        
        {/* Mobile Header */}
        {!hasOwnHeader && (
            <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md px-4 h-14 flex items-center justify-between">
                {/* Left Side */}
                <div className="flex items-center gap-2 flex-1">
                    {location === "/profile" ? (
                        // Own profile page: Theme button on left
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        >
                            {mounted && theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </Button>
                    ) : location.startsWith("/user") ? (
                        // User profile page: Empty left side
                        <div className="w-0" />
                    ) : (
                        // Other pages: Logo and Novii
                        <>
                            <img src={logo} alt="Novii" className="w-6 h-6 rounded-lg" />
                            <span className="font-display font-bold text-lg leading-none">Novii</span>
                        </>
                    )}
                </div>

                {/* Center */}
                <div className="flex-1 text-center flex items-center justify-center gap-1">
                    <span className="text-sm font-semibold truncate">
                        {location === "/profile" ? (profile?.username || 'User') : location.startsWith('/user') ? (visitedUserProfile?.username || 'User') : ''}
                    </span>
                    {location.startsWith('/user') && visitedUserProfile && (
                        <div className="flex items-center gap-0.5">
                            {visitedUserProfile.is_verified && (
                                <VerifiedBadge size="sm" />
                            )}
                            {visitedUserProfile.is_official && (
                                <OfficialBadge size="sm" />
                            )}
                        </div>
                    )}
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2 flex-1 justify-end">
                    {location === "/profile" && (
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={handleLogout}
                            className="hover:text-destructive transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    )}
                    {location !== "/profile" && !location.startsWith("/user") && (
                        <>
                            <Link href="/notifications">
                                <Button variant="ghost" size="icon" className="relative">
                                    <Heart className="w-5 h-5" />
                                    {unreadCount > 0 && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive"></span>}
                                </Button>
                            </Link>
                            <Link href="/messages">
                                <Button variant="ghost" size="icon">
                                    <MessageCircle className="w-5 h-5" />
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </header>
        )}

        {children}
      </main>


      {/* Right Sidebar (Suggestions) - Only visible on Home Page */}
      {isHome && (
        <div className="order-3 hidden xl:block border-s border-border/40 w-96 h-full overflow-y-auto">
            <SuggestionsSidebar />
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background/90 backdrop-blur-lg z-50 flex items-center justify-around px-2",
        chatActive && "hidden"
      )}>
        <Link href="/">
            <button 
              type="button"
              onDoubleClick={() => window.dispatchEvent(new CustomEvent('doubleClickHome'))}
              className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer"
            >
                <Home className={cn("w-6 h-6", location === "/" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </button>
        </Link>
        <Link href="/search">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <Search className={cn("w-6 h-6", location === "/search" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
        <Link href="/explore">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <Compass className={cn("w-6 h-6", location === "/explore" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
        <Link href="/reels">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <Clapperboard className={cn("w-6 h-6", location === "/reels" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </div>
        </Link>
        <Link href="/create">
            <div className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer">
                <PlusSquare className="w-6 h-6 text-muted-foreground" />
            </div>
        </Link>
        <Link href="/profile">
            <button 
              type="button"
              onDoubleClick={() => window.dispatchEvent(new CustomEvent('doubleClickProfile'))}
              className="p-3 rounded-full active:scale-95 transition-transform cursor-pointer"
            >
                <User className={cn("w-6 h-6", location === "/profile" ? "text-primary stroke-[3px]" : "text-muted-foreground")} />
            </button>
        </Link>
      </nav>
    </div>
  );
}
