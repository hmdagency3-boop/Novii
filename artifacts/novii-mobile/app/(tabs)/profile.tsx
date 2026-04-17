import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  getCurrentProfile,
  getSavedPosts,
  getUserPosts,
  getUserReels,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type TabKey = "posts" | "reels" | "saved" | "tagged";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<TabKey>("posts");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["currentProfile"],
    queryFn: getCurrentProfile,
    enabled: !!user,
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["userPosts", user?.id],
    queryFn: () => (user ? getUserPosts(user.id) : []),
    enabled: !!user,
  });

  const { data: reels = [] } = useQuery({
    queryKey: ["userReels", user?.id],
    queryFn: () => (user ? getUserReels(user.id) : []),
    enabled: !!user && tab === "reels",
  });

  const { data: saved = [] } = useQuery({
    queryKey: ["savedPosts"],
    queryFn: getSavedPosts,
    enabled: !!user && tab === "saved",
  });

  const tile = (width - 4) / 3;
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 84 : 0;

  const gridData =
    tab === "posts"
      ? posts
      : tab === "reels"
      ? reels
      : tab === "saved"
      ? saved
      : [];

  const tabs: { key: TabKey; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "posts", icon: "grid" },
    { key: "reels", icon: "film" },
    { key: "saved", icon: "bookmark" },
    { key: "tagged", icon: "user" },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Top header with username + menu */}
      <View
        style={[
          styles.topbar,
          {
            paddingTop: insets.top + webTopInset,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
          <Text style={[styles.usernameTop, { color: colors.foreground }]}>
            {profile?.username ?? "..."}
          </Text>
          {profile?.is_verified ? (
            <Feather name="check-circle" size={14} color={colors.primary} />
          ) : null}
        </View>
        <Pressable onPress={() => router.push("/create" as any)} hitSlop={8} style={styles.iconBtn}>
          <Feather name="plus-square" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={() => router.push("/settings" as any)} hitSlop={8} style={styles.iconBtn}>
          <Feather name="menu" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <FlatList
        data={gridData}
        keyExtractor={(item, idx) => `${tab}-${(item as any).id ?? idx}`}
        numColumns={3}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 50,
          paddingBottom: insets.bottom + webBottomInset + 16,
        }}
        ListHeaderComponent={
          <View>
            {isLoading || !profile ? (
              <View style={{ paddingVertical: 60, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                <View style={styles.headerRow}>
                  {/* Avatar with story ring */}
                  <View style={styles.avatarWrap}>
                    <LinearGradient
                      colors={["#9333ea", "#ec4899", "#f59e0b"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.ring}
                    >
                      <View style={[styles.ringInner, { backgroundColor: colors.background }]}>
                        {profile.avatar_url ? (
                          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                          <View
                            style={[
                              styles.avatar,
                              { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
                            ]}
                          >
                            <Feather name="user" size={32} color={colors.mutedForeground} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </View>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <Stat label="Posts" value={profile.posts_count ?? posts.length} colors={colors} />
                    <Stat
                      label="Followers"
                      value={profile.followers_count ?? 0}
                      colors={colors}
                      onPress={() =>
                        router.push(`/user/${profile.id}` as any)
                      }
                    />
                    <Stat
                      label="Following"
                      value={profile.following_count ?? 0}
                      colors={colors}
                    />
                  </View>
                </View>

                <View style={styles.bioBlock}>
                  {profile.full_name ? (
                    <Text style={[styles.fullName, { color: colors.foreground }]}>
                      {profile.full_name}
                    </Text>
                  ) : null}
                  {profile.bio ? (
                    <Text style={[styles.bio, { color: colors.foreground }]}>
                      {profile.bio}
                    </Text>
                  ) : null}
                  {profile.website ? (
                    <Pressable onPress={() => Linking.openURL(profile.website!)}>
                      <Text style={[styles.link, { color: colors.primary }]}>
                        {profile.website}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.actionText, { color: colors.foreground }]}>
                      Edit profile
                    </Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.actionText, { color: colors.foreground }]}>
                      Share profile
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/notifications")}
                    style={[styles.iconActionBtn, { backgroundColor: colors.secondary }]}
                  >
                    <Feather name="user-plus" size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              </>
            )}

            {/* Tab strip */}
            <View style={[styles.tabStrip, { borderTopColor: colors.border }]}>
              {tabs.map((t) => {
                const active = t.key === tab;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTab(t.key)}
                    style={[
                      styles.tabBtn,
                      active && { borderBottomColor: colors.foreground },
                    ]}
                  >
                    <Feather
                      name={t.icon}
                      size={22}
                      color={active ? colors.foreground : colors.mutedForeground}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item, index }) => {
          const it: any = item;
          const uri = it.image_url ?? it.thumbnail_url ?? it.video_url;
          return (
            <Pressable
              onPress={() => router.push(`/post/${it.id}`)}
              style={{
                width: tile,
                height: tile,
                marginRight: (index + 1) % 3 === 0 ? 0 : 2,
                marginBottom: 2,
                backgroundColor: colors.muted,
              }}
            >
              {uri ? (
                <Image
                  source={{ uri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          !postsLoading ? (
            <View style={styles.empty}>
              <Feather
                name={tab === "reels" ? "film" : tab === "saved" ? "bookmark" : "camera"}
                size={36}
                color={colors.mutedForeground}
              />
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                Nothing here yet
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function Stat({
  label,
  value,
  colors,
  onPress,
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap onPress={onPress} style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 17 }}>
        {(value ?? 0).toLocaleString()}
      </Text>
      <Text
        style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 2 }}
      >
        {label}
      </Text>
    </Wrap>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topbar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { padding: 6, marginLeft: 8 },
  usernameTop: { fontFamily: "Inter_700Bold", fontSize: 18 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  avatarWrap: { width: 86, height: 86 },
  ring: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 74, height: 74, borderRadius: 37 },
  statsRow: { flex: 1, flexDirection: "row" },
  bioBlock: { paddingHorizontal: 16, paddingTop: 12, gap: 2 },
  fullName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  bio: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 18, marginTop: 2 },
  link: { fontFamily: "Inter_500Medium", fontSize: 14, marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabStrip: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  tabBtn: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
