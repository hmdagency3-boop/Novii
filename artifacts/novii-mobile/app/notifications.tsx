import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  getNotifications,
  markNotificationRead,
  type NotificationRow,
} from "@/lib/api";
import { timeAgo } from "@/lib/utils";

const TYPE_TEXT: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  follow_request: "requested to follow you",
  mention: "mentioned you",
};

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  const open = async (n: NotificationRow) => {
    if (!n.is_read) {
      try {
        await markNotificationRead(n.id);
        qc.invalidateQueries({ queryKey: ["notifications"] });
      } catch {}
    }
    if (n.post_id) router.push(`/post/${n.post_id}`);
    else if (n.actor_id) router.push(`/user/${n.actor_id}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={data ?? []}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            style={[
              styles.row,
              !item.is_read ? { backgroundColor: colors.accent } : null,
            ]}
          >
            {item.actor?.avatar_url ? (
              <Image source={{ uri: item.actor.avatar_url }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Feather name="user" size={18} color={colors.mutedForeground} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.text, { color: colors.foreground }]}>
                <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                  {item.actor?.username ?? "Someone"}{" "}
                </Text>
                {TYPE_TEXT[item.type] ?? item.type}
                {item.content ? `: ${item.content}` : ""}
              </Text>
              <Text style={[styles.time, { color: colors.mutedForeground }]}>
                {timeAgo(item.created_at)}
              </Text>
            </View>
            {item.post?.image_url ? (
              <Image source={{ uri: item.post.image_url }} style={styles.thumb} />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={[styles.center, { paddingTop: 80 }]}>
            <Feather name="bell" size={32} color={colors.mutedForeground} />
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>
              No notifications yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  text: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 18 },
  time: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  thumb: { width: 44, height: 44, borderRadius: 4 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
