import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MentionAutocompleteProps {
  inputValue: string;
  onSelectUser: (username: string) => void;
  isOpen: boolean;
}

export function MentionAutocomplete({ inputValue, onSelectUser, isOpen }: MentionAutocompleteProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || inputValue.length < 1) {
      setUsers([]);
      return;
    }

    const searchQuery = inputValue.replace(/.*@/, '');
    if (searchQuery.length < 1) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await api.searchUsers(searchQuery);
        setUsers(results);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, isOpen]);

  if (!isOpen || users.length === 0) return null;

  return (
    <div className="absolute bottom-16 left-0 right-0 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
      {users.map((user) => (
        <button
          key={user.id}
          onClick={() => onSelectUser(user.username)}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors text-left"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} />
            <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.full_name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
