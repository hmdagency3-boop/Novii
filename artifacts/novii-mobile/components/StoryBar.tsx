import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { getStories, type Story } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function StoryBar() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: getStories,
    staleTime: 60_000,
  });

  // Group by user, excluding the current user (they get the "Your story" tile)
  const byUser = new Map<string, { profile: Story["profile"]; viewed: boolean }>();
  for (const s of stories) {
    if (s.user_id === user?.id) continue;
    const existing = byUser.get(s.user_id);
    if (!existing) {
      byUser.set(s.user_id, { profile: s.profile, viewed: !!s.is_viewed });
    } else {
      existing.viewed = existing.viewed && !!s.is_viewed;
    }
  }
  const users = Array.from(byUser.entries());

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {/* My story (always first) */}
      <Pressable
        onPress={() => router.push("/create-story")}
        style={styles.item}
      >
        <View style={[styles.avatarRing, { borderColor: colors.border }]}>
          {user?.user_metadata?.avatar_url ? (
            <Image
              source={{ uri: user.user_metadata.avatar_url as string }}
              style={styles.avatar}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
              ]}
            >
              <Feather name="user" size={20} color={colors.mutedForeground} />
            </View>
          )}
          <View
            style={[
              styles.plus,
              { backgroundColor: colors.primary, borderColor: colors.background },
            ]}
          >
            <Feather name="plus" size={12} color={colors.primaryForeground} />
          </View>
        </View>
        <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
          Your story
        </Text>
      </Pressable>

      {users.map(([uid, info]) => (
        <Pressable
          key={uid}
          onPress={() => router.push(`/story/${uid}`)}
          style={styles.item}
        >
          {info.viewed ? (
            <View style={[styles.avatarRing, { borderColor: colors.border, borderWidth: 2 }]}>
              {info.profile?.avatar_url ? (
                <Image source={{ uri: info.profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.muted }]} />
              )}
            </View>
          ) : (
            <LinearGradient
              colors={["#7c3aed", "#ec4899", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientRing}
            >
              <View style={[styles.gradientInner, { backgroundColor: colors.background }]}>
                {info.profile?.avatar_url ? (
                  <Image source={{ uri: info.profile.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.muted }]} />
                )}
              </View>
            </LinearGradient>
          )}
          <Text
            style={[styles.label, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {info.profile?.username ?? "user"}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 10, gap: 14 },
  item: { alignItems: "center", width: 72 },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  plus: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 6, maxWidth: 72 },
});
