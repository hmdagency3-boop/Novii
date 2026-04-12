import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './auth-context';
import { fetchUserSettings, saveUserSettingsToDb, DEFAULT_SETTINGS, blockedUsers, closeFriends, mutedUsers, restrictedUsers, favoriteUsers, type UserSettings, type StoredUser } from './settings-storage';

interface SettingsContextType {
  settings: UserSettings;
  settingsLoaded: boolean;
  blockedIds: Set<string>;
  mutedIds: Set<string>;
  closeFriendIds: Set<string>;
  restrictedIds: Set<string>;
  favoriteIds: Set<string>;
  blockedList: StoredUser[];
  friendsList: StoredUser[];
  mutedList: StoredUser[];
  restrictedList: StoredUser[];
  favsList: StoredUser[];
  isBlocked: (userId: string) => boolean;
  isMuted: (userId: string) => boolean;
  isCloseFriend: (userId: string) => boolean;
  isRestricted: (userId: string) => boolean;
  isFavorite: (userId: string) => boolean;
  blockUser: (targetId: string) => Promise<void>;
  unblockUser: (targetId: string) => Promise<void>;
  muteUser: (targetId: string) => Promise<void>;
  unmuteUser: (targetId: string) => Promise<void>;
  addCloseFriend: (targetId: string) => Promise<void>;
  removeCloseFriend: (targetId: string) => Promise<void>;
  restrictUser: (targetId: string) => Promise<void>;
  unrestrictUser: (targetId: string) => Promise<void>;
  addFavorite: (targetId: string) => Promise<void>;
  removeFavorite: (targetId: string) => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => void;
  updateNestedSettings: <K extends keyof UserSettings>(key: K, partial: Partial<UserSettings[K]>) => void;
  refetchLists: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_SETTINGS });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [blockedList, setBlockedList] = useState<StoredUser[]>([]);
  const [friendsList, setFriendsList] = useState<StoredUser[]>([]);
  const [mutedList, setMutedList] = useState<StoredUser[]>([]);
  const [restrictedList, setRestrictedList] = useState<StoredUser[]>([]);
  const [favsList, setFavsList] = useState<StoredUser[]>([]);

  const blockedIds = new Set(blockedList.map(u => u.id));
  const mutedIds = new Set(mutedList.map(u => u.id));
  const closeFriendIds = new Set(friendsList.map(u => u.id));
  const restrictedIds = new Set(restrictedList.map(u => u.id));
  const favoriteIds = new Set(favsList.map(u => u.id));

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [s, b, f, m, r, fv] = await Promise.all([
        fetchUserSettings(user.id),
        blockedUsers.get(user.id),
        closeFriends.get(user.id),
        mutedUsers.get(user.id),
        restrictedUsers.get(user.id),
        favoriteUsers.get(user.id),
      ]);
      setSettings(s);
      setBlockedList(b);
      setFriendsList(f);
      setMutedList(m);
      setRestrictedList(r);
      setFavsList(fv);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setSettingsLoaded(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadAll();
    } else {
      setSettings({ ...DEFAULT_SETTINGS });
      setBlockedList([]);
      setFriendsList([]);
      setMutedList([]);
      setRestrictedList([]);
      setFavsList([]);
      setSettingsLoaded(true);
    }
  }, [user?.id, loadAll]);

  const persistSettings = useCallback((updated: UserSettings) => {
    if (!user?.id) return;
    saveUserSettingsToDb(user.id, updated).catch(err => console.error('Failed to persist settings:', err));
  }, [user?.id]);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...partial };
      persistSettings(updated);
      return updated;
    });
  }, [persistSettings]);

  const updateNestedSettings = useCallback(<K extends keyof UserSettings>(key: K, partial: Partial<UserSettings[K]>) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: { ...(prev[key] as any), ...partial } };
      persistSettings(updated);
      return updated;
    });
  }, [persistSettings]);

  const blockUser = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await blockedUsers.add(user.id, targetId);
    setBlockedList(prev => [...prev, { id: targetId, username: '', avatar_url: '', added_at: new Date().toISOString() }]);
    const refreshed = await blockedUsers.get(user.id);
    setBlockedList(refreshed);
  }, [user?.id]);

  const unblockUser = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await blockedUsers.remove(user.id, targetId);
    setBlockedList(prev => prev.filter(u => u.id !== targetId));
  }, [user?.id]);

  const muteUser = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await mutedUsers.add(user.id, targetId);
    setMutedList(prev => [...prev, { id: targetId, username: '', avatar_url: '', added_at: new Date().toISOString() }]);
    const refreshed = await mutedUsers.get(user.id);
    setMutedList(refreshed);
  }, [user?.id]);

  const unmuteUser = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await mutedUsers.remove(user.id, targetId);
    setMutedList(prev => prev.filter(u => u.id !== targetId));
  }, [user?.id]);

  const addCloseFriend = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await closeFriends.add(user.id, targetId);
    setFriendsList(prev => [...prev, { id: targetId, username: '', avatar_url: '', added_at: new Date().toISOString() }]);
    const refreshed = await closeFriends.get(user.id);
    setFriendsList(refreshed);
  }, [user?.id]);

  const removeCloseFriend = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await closeFriends.remove(user.id, targetId);
    setFriendsList(prev => prev.filter(u => u.id !== targetId));
  }, [user?.id]);

  const restrictUser = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await restrictedUsers.add(user.id, targetId);
    setRestrictedList(prev => [...prev, { id: targetId, username: '', avatar_url: '', added_at: new Date().toISOString() }]);
    const refreshed = await restrictedUsers.get(user.id);
    setRestrictedList(refreshed);
  }, [user?.id]);

  const unrestrictUser = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await restrictedUsers.remove(user.id, targetId);
    setRestrictedList(prev => prev.filter(u => u.id !== targetId));
  }, [user?.id]);

  const addFavorite = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await favoriteUsers.add(user.id, targetId);
    setFavsList(prev => [...prev, { id: targetId, username: '', avatar_url: '', added_at: new Date().toISOString() }]);
    const refreshed = await favoriteUsers.get(user.id);
    setFavsList(refreshed);
  }, [user?.id]);

  const removeFavorite = useCallback(async (targetId: string) => {
    if (!user?.id) return;
    await favoriteUsers.remove(user.id, targetId);
    setFavsList(prev => prev.filter(u => u.id !== targetId));
  }, [user?.id]);

  const refetchLists = useCallback(async () => {
    await loadAll();
  }, [loadAll]);

  return (
    <SettingsContext.Provider value={{
      settings, settingsLoaded,
      blockedIds, mutedIds, closeFriendIds, restrictedIds, favoriteIds,
      blockedList, friendsList, mutedList, restrictedList, favsList,
      isBlocked: (id) => blockedIds.has(id),
      isMuted: (id) => mutedIds.has(id),
      isCloseFriend: (id) => closeFriendIds.has(id),
      isRestricted: (id) => restrictedIds.has(id),
      isFavorite: (id) => favoriteIds.has(id),
      blockUser, unblockUser,
      muteUser, unmuteUser,
      addCloseFriend, removeCloseFriend,
      restrictUser, unrestrictUser,
      addFavorite, removeFavorite,
      updateSettings, updateNestedSettings,
      refetchLists,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
