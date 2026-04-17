import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import {
  createComment,
  getComments,
  getPost,
  toggleLike,
  toggleSave,
  type Comment,
} from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/utils";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = id as string;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { width } = useWindowDimensions();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPost(postId),
  });
  const { data: comments = [] } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
  });

  const [liked, setLiked] = useState<boolean | undefined>();
  const [saved, setSaved] = useState<boolean | undefined>();
  const [count, setCount] = useState<number | undefined>();
  const isLiked = liked ?? !!post?.is_liked;
  const isSaved = saved ?? !!post?.is_saved;
  const likeCount = count ?? post?.likes_count ?? 0;

  const onLike = async () => {
    if (!post) return;
    const next = !isLiked;
    setLiked(next);
    setCount(likeCount + (next ? 1 : -1));
    try {
      await toggleLike(post.id, isLiked);
    } catch {
      setLiked(!next);
    }
  };

  const onSave = async () => {
    if (!post) return;
    const next = !isSaved;
    setSaved(next);
    try {
      await toggleSave(post.id, isSaved);
    } catch {
      setSaved(!next);
    }
  };

  const submit = async () => {
    const t = text.trim();
    if (!t || posting) return;
    setPosting(true);
    try {
      await createComment(postId, t);
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    } finally {
      setPosting(false);
    }
  };

  if (isLoading || !post) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CommentRow comment={item} />}
        ListHeaderComponent={
          <View>
            <View style={styles.userRow}>
              <Pressable
                onPress={() => router.push(`/user/${post.user_id}`)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
              >
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
                <Text style={[styles.username, { color: colors.foreground }]}>
                  {post.profile?.username ?? "user"}
                </Text>
              </Pressable>
            </View>

            {post.image_url ? (
              <Image
                source={{ uri: post.image_url }}
                style={{ width, height: width, backgroundColor: colors.muted }}
                contentFit="cover"
              />
            ) : null}

            <View style={styles.actionsRow}>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <Pressable onPress={onLike} hitSlop={8}>
                  <Feather
                    name="heart"
                    size={26}
                    color={isLiked ? "#ef4444" : colors.foreground}
                  />
                </Pressable>
                <Pressable hitSlop={8}>
                  <Feather name="message-circle" size={26} color={colors.foreground} />
                </Pressable>
                <Pressable hitSlop={8}>
                  <Feather name="send" size={24} color={colors.foreground} />
                </Pressable>
              </View>
              <Pressable onPress={onSave} hitSlop={8}>
                <Feather name="bookmark" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {likeCount > 0 ? (
              <Text style={[styles.likes, { color: colors.foreground }]}>
                {formatCount(likeCount)} likes
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

            <View style={[styles.divider, { borderTopColor: colors.border }]} />
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.center, { paddingVertical: 40 }]}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
              Be the first to comment
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Add a comment..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.input,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        />
        <Pressable
          onPress={submit}
          disabled={!text.trim() || posting}
          hitSlop={8}
          style={{ opacity: !text.trim() || posting ? 0.5 : 1 }}
        >
          <Text style={[styles.postBtn, { color: colors.primary }]}>Post</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentRow({ comment }: { comment: Comment }) {
  const colors = useColors();
  return (
    <View style={styles.commentRow}>
      {comment.profile?.avatar_url ? (
        <Image source={{ uri: comment.profile.avatar_url }} style={styles.commentAvatar} />
      ) : (
        <View
          style={[
            styles.commentAvatar,
            { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
          ]}
        >
          <Feather name="user" size={14} color={colors.mutedForeground} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 18 }}>
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>
            {comment.profile?.username ?? "user"}{" "}
          </Text>
          {comment.content}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2, fontFamily: "Inter_400Regular" }}>
          {timeAgo(comment.created_at)}
        </Text>
        {(comment.replies ?? []).map((r) => (
          <View key={r.id} style={{ marginTop: 8, marginLeft: 16 }}>
            <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 17 }}>
              <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                {r.profile?.username ?? "user"}{" "}
              </Text>
              {r.content}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  userRow: { flexDirection: "row", alignItems: "center", padding: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 12,
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
    paddingBottom: 12,
    textTransform: "uppercase",
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  postBtn: { fontFamily: "Inter_700Bold", fontSize: 15 },
});
