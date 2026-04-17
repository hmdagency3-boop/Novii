import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { toggleLike, toggleSave, type Post } from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/utils";

export default function PostCard({ post }: { post: Post }) {
  const colors = useColors();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [liked, setLiked] = useState(!!post.is_liked);
  const [saved, setSaved] = useState(!!post.is_saved);
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

  const onSave = async () => {
    const next = !saved;
    setSaved(next);
    try {
      await toggleSave(post.id, saved);
    } catch {
      setSaved(saved);
    }
  };

  const goProfile = () => {
    if (post.user_id) router.push(`/user/${post.user_id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goProfile} style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
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
            {post.location ? (
              <Text style={[styles.location, { color: colors.mutedForeground }]}>
                {post.location}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable hitSlop={8}>
          <Feather name="more-horizontal" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {post.image_url ? (
        <Pressable onPress={() => router.push(`/post/${post.id}`)}>
          <Image
            source={{ uri: post.image_url }}
            style={{ width, height: width, backgroundColor: colors.muted }}
            contentFit="cover"
          />
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Pressable onPress={onLike} hitSlop={8}>
            <Feather
              name="heart"
              size={26}
              color={liked ? "#ef4444" : colors.foreground}
            />
          </Pressable>
          <Pressable onPress={() => router.push(`/post/${post.id}`)} hitSlop={8}>
            <Feather name="message-circle" size={26} color={colors.foreground} />
          </Pressable>
          <Pressable hitSlop={8}>
            <Feather name="send" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <Pressable onPress={onSave} hitSlop={8}>
          <Feather
            name="bookmark"
            size={24}
            color={colors.foreground}
            style={saved ? { opacity: 1 } : undefined}
          />
        </Pressable>
      </View>

      {!post.hide_likes && count > 0 ? (
        <Text style={[styles.likes, { color: colors.foreground }]}>
          {formatCount(count)} likes
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

      {post.comments_count > 0 ? (
        <Pressable onPress={() => router.push(`/post/${post.id}`)}>
          <Text style={[styles.viewComments, { color: colors.mutedForeground }]}>
            View all {formatCount(post.comments_count)} comments
          </Text>
        </Pressable>
      ) : null}

      <Text style={[styles.time, { color: colors.mutedForeground }]}>
        {timeAgo(post.created_at)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  location: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 1 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  viewComments: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    paddingHorizontal: 12,
    paddingTop: 4,
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
