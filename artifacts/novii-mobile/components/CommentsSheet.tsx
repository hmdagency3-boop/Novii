import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { createComment, getComments, type Comment } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

export default function CommentsSheet({
  postId,
  visible,
  onClose,
  onCommentAdded,
}: {
  postId: string;
  visible: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { height } = useWindowDimensions();
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: visible,
  });

  const submit = async () => {
    const t = text.trim();
    if (!t || posting) return;
    setPosting(true);
    try {
      await createComment(postId, t);
      setText("");
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      onCommentAdded?.();
    } finally {
      setPosting(false);
    }
  };

  const sheetHeight = Math.round(height * 0.7);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={styles.sheetWrap}
        pointerEvents="box-none"
      >
        <View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Grabber */}
          <View style={styles.grabberWrap}>
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Comments</Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          {/* List */}
          {isLoading ? (
            <View style={[styles.center, { flex: 1 }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              style={{ flex: 1 }}
              contentContainerStyle={
                comments.length === 0
                  ? { flexGrow: 1, justifyContent: "center" }
                  : { paddingVertical: 8 }
              }
              renderItem={({ item }) => <CommentRow comment={item} />}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Feather name="message-circle" size={28} color={colors.mutedForeground} />
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontFamily: "Inter_500Medium",
                      marginTop: 8,
                    }}
                  >
                    Be the first to comment
                  </Text>
                </View>
              }
            />
          )}

          {/* Input bar */}
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
              style={{ opacity: !text.trim() || posting ? 0.4 : 1 }}
            >
              {posting ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={[styles.postBtn, { color: colors.primary }]}>Post</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
        <Text
          style={{
            color: colors.foreground,
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            lineHeight: 18,
          }}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold" }}>
            {comment.profile?.username ?? "user"}{" "}
          </Text>
          {comment.content}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
            marginTop: 2,
            fontFamily: "Inter_400Regular",
          }}
        >
          {timeAgo(comment.created_at)}
        </Text>
        {(comment.replies ?? []).map((r) => (
          <View key={r.id} style={{ marginTop: 8, marginLeft: 16 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: 13,
                fontFamily: "Inter_400Regular",
                lineHeight: 17,
              }}
            >
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  grabberWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  grabber: { width: 40, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  closeBtn: { position: "absolute", right: 12, padding: 4 },
  center: { alignItems: "center", justifyContent: "center" },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  commentRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
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
