import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  getProfile,
  getUserPosts,
  isFollowing,
  toggleFollow,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatCount } from "@/lib/utils";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = id as string;
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isMe = user?.id === userId;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId),
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["userPosts", userId],
    queryFn: () => getUserPosts(userId),
  });
  const { data: following = false } = useQuery({
    queryKey: ["following", userId],
    queryFn: () => isFollowing(userId),
    enabled: !isMe,
  });

  const [follow, setFollow] = useState<boolean | undefined>();
  const isFollow = follow ?? following;

  const onFollow = async () => {
    const next = !isFollow;
    setFollow(next);
    try {
      await toggleFollow(userId, isFollow);
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    } catch {
      setFollow(!next);
    }
  };

  const tile = (width - 4) / 3;

  if (isLoading || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: profile.username }} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          numColumns={3}
          ListHeaderComponent={
            <View>
              <View style={styles.profileBlock}>
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
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <Stat label="Posts" value={profile.posts_count ?? posts.length} colors={colors} />
                  <Stat label="Followers" value={profile.followers_count ?? 0} colors={colors} />
                  <Stat label="Following" value={profile.following_count ?? 0} colors={colors} />
                </View>
              </View>

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

              {!isMe ? (
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={onFollow}
                    style={[
                      styles.btn,
                      {
                        backgroundColor: isFollow ? colors.muted : colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isFollow ? colors.foreground : colors.primaryForeground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      {isFollow ? "Following" : "Follow"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/chat/${userId}`)}
                    style={[styles.btn, { backgroundColor: colors.muted }]}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 14,
                      }}
                    >
                      Message
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={[styles.divider, { borderTopColor: colors.border }]} />
            </View>
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push(`/post/${item.id}`)}
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
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Feather name="camera" size={32} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginTop: 8, fontFamily: "Inter_500Medium" }}>
                No posts yet
              </Text>
            </View>
          }
        />
      </View>
    </>
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
        {formatCount(value)}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  profileBlock: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  fullName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  bio: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 16,
    marginTop: 4,
    lineHeight: 18,
  },
  actionRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 12 },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16 },
});
