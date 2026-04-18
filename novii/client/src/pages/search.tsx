import Layout from "@/components/layout";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useSettings } from "@/lib/settings-context";

interface SearchProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  is_verified: boolean;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useLanguage();
  const { blockedIds } = useSettings();

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const users = await api.searchUsers(query);
        // Sort by followers_count in descending order (highest first)
        const sortedUsers = (users as SearchProfile[]).sort(
          (a, b) => b.followers_count - a.followers_count
        );
        setResults(sortedUsers);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <Layout>
      <div className="flex flex-col min-h-screen w-full">
        {/* Search Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md p-4 border-b border-border">
          <div className="relative max-w-md mx-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder={language.code === 'ar' ? "ابحث عن حسابات..." : "Search accounts..."} 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-primary transition-all rounded-xl"
            />
          </div>
        </div>

        {/* Results */}
        <div className="p-4 max-w-2xl mx-auto w-full">
          {query.trim() === "" ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{language.code === 'ar' ? 'ابدأ الكتابة للبحث عن حسابات' : 'Start typing to search for accounts'}</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>{language.code === 'ar' ? 'جاري البحث...' : 'Searching...'}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.filter(user => !blockedIds.has(user.id)).map((user) => (
                <Link key={user.id} href={`/@${user.username}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="w-12 h-12 rounded-full object-cover group-hover:ring-2 ring-primary transition-all"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center text-white font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{user.username}</h3>
                        {user.is_verified && (
                          <span className="text-primary text-sm">✓</span>
                        )}
                      </div>
                      {user.full_name && (
                        <p className="text-sm text-muted-foreground truncate">{user.full_name}</p>
                      )}
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate">{user.bio}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {language.code === 'ar' 
                          ? `${user.followers_count} متابع` 
                          : `${user.followers_count} followers`
                        }
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>{language.code === 'ar' ? 'لم نجد حسابات مطابقة' : 'No accounts found'}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
