import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { toggleLike, type Post } from "@/lib/api";

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

export default function PostCard({ post }: { post: Post }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const [liked, setLiked] = useState(!!post.is_liked);
  const [count, setCount] = useState(post.likes_count ?? 0);

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await toggleLike(post.id, liked);
    } catch {
      setLiked(liked);
      setCount(post.likes_count ?? 0);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {post.profile?.avatar_url ? (
          <Image source={{ uri: post.profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
            ]}
          >
            <Feather name="user" size={16} color={colors.mutedForeground} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={[styles.username, { color: colors.foreground }]}>
              {post.profile?.username ?? "user"}
            </Text>
            {post.profile?.is_verified ? (
              <Feather name="check-circle" size={12} color={colors.primary} />
            ) : null}
          </View>
        </View>
        <Pressable hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={{ width, height: width, backgroundColor: colors.muted }}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={onLike} hitSlop={8}>
          <Feather
            name="heart"
            size={24}
            color={liked ? "#ef4444" : colors.foreground}
          />
        </Pressable>
        <Pressable hitSlop={8}>
          <Feather name="message-circle" size={24} color={colors.foreground} />
        </Pressable>
        <Pressable hitSlop={8}>
          <Feather name="send" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {count > 0 ? (
        <Text style={[styles.likes, { color: colors.foreground }]}>
          {count.toLocaleString()} likes
        </Text>
      ) : null}

      {post.caption ? (
        <Text style={[styles.caption, { color: colors.foreground }]}>
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>
            {post.profile?.username ?? "user"}{" "}
          </Text>
          {post.caption}
        </Text>
      ) : null}

      <Text style={[styles.time, { color: colors.mutedForeground }]}>
        {timeAgo(post.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  likes: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  caption: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingTop: 4,
    lineHeight: 18,
  },
  time: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
    textTransform: "uppercase",
  },
});
