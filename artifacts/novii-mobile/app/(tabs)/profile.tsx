import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getProfile, getUserPosts } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user ? getProfile(user.id) : null),
    enabled: !!user,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["userPosts", user?.id],
    queryFn: () => (user ? getUserPosts(user.id) : []),
    enabled: !!user,
  });

  const tile = (width - 4) / 3;
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 84 : 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        numColumns={3}
        contentContainerStyle={{
          paddingTop: insets.top + webTopInset + 8,
          paddingBottom: insets.bottom + webBottomInset + 16,
        }}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={[styles.username, { color: colors.foreground }]}>
                {profile?.username ?? "..."}
              </Text>
              <Pressable onPress={signOut} hitSlop={8}>
                <Feather name="log-out" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <View style={styles.profileBlock}>
                {profile?.avatar_url ? (
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

                <View style={styles.statsRow}>
                  <Stat label="Posts" value={profile?.posts_count ?? posts.length} colors={colors} />
                  <Stat label="Followers" value={profile?.followers_count ?? 0} colors={colors} />
                  <Stat label="Following" value={profile?.following_count ?? 0} colors={colors} />
                </View>
              </View>
            )}

            {profile?.full_name ? (
              <Text style={[styles.fullName, { color: colors.foreground }]}>
                {profile.full_name}
              </Text>
            ) : null}
            {profile?.bio ? (
              <Text style={[styles.bio, { color: colors.foreground }]}>
                {profile.bio}
              </Text>
            ) : null}

            <View style={styles.divider} />
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={{
              width: tile,
              height: tile,
              marginRight: (index + 1) % 3 === 0 ? 0 : 2,
              marginBottom: 2,
              backgroundColor: colors.muted,
            }}
          >
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={{ width: tile, height: tile }}
                contentFit="cover"
              />
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Feather name="camera" size={32} color={colors.mutedForeground} />
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                No posts yet
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
}: {
  label: string;
  value: number;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 18 }}>
        {value.toLocaleString()}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  username: { fontFamily: "Inter_700Bold", fontSize: 20 },
  profileBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 12,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  statsRow: { flex: 1, flexDirection: "row" },
  fullName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 4,
    lineHeight: 18,
  },
  divider: { height: 16 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 60 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
