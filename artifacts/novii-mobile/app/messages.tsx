import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
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
import { getConversations } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

export default function MessagesScreen() {
  const colors = useColors();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
  });

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
        keyExtractor={(c) => c.user.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/chat/${item.user.id}`)}
            style={styles.row}
          >
            {item.user.avatar_url ? (
              <Image source={{ uri: item.user.avatar_url }} style={styles.avatar} />
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
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={[styles.username, { color: colors.foreground }]}>
                  {item.user.username}
                </Text>
                {item.user.is_verified ? (
                  <Feather name="check-circle" size={12} color={colors.primary} />
                ) : null}
              </View>
              <Text
                style={[
                  styles.preview,
                  {
                    color: item.unread > 0 ? colors.foreground : colors.mutedForeground,
                    fontFamily: item.unread > 0 ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
                numberOfLines={1}
              >
                {item.last.content || "[image]"} · {timeAgo(item.last.created_at)}
              </Text>
            </View>
            {item.unread > 0 ? (
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={[styles.center, { paddingTop: 80 }]}>
            <Feather name="message-circle" size={32} color={colors.mutedForeground} />
            <Text style={[styles.muted, { color: colors.mutedForeground }]}>
              No messages yet
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
  avatar: { width: 50, height: 50, borderRadius: 25 },
  username: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  preview: { fontSize: 13, marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
