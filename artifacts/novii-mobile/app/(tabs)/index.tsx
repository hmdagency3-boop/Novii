import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "@/components/PostCard";
import StoryBar from "@/components/StoryBar";
import { useColors } from "@/hooks/useColors";
import { getFeed, getNotifications } from "@/lib/api";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["feed"],
    queryFn: () => getFeed(20, 0),
  });

  const { data: notifs = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    staleTime: 60_000,
  });
  const unread = notifs.filter((n) => !n.is_read).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["feed"] }),
      qc.invalidateQueries({ queryKey: ["stories"] }),
      qc.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
    setRefreshing(false);
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 84 : 0;
  const headerHeight = 52;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopInset,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerSide}>
          <Pressable onPress={() => router.push("/messages")} hitSlop={8} style={styles.iconBtn}>
            <Feather name="message-circle" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Image
            source={require("@/assets/images/novii_logo.png")}
            style={styles.logoImg}
            contentFit="contain"
          />
          <Text style={[styles.brand, { color: colors.foreground }]}>Novii</Text>
        </View>
        <View style={[styles.headerSide, { justifyContent: "flex-end" }]}>
          <Pressable onPress={() => router.push("/notifications")} hitSlop={8} style={styles.iconBtn}>
            <Feather name="heart" size={22} color={colors.foreground} />
            {unread > 0 ? (
              <View style={[styles.badge, { backgroundColor: colors.destructive }]} />
            ) : null}
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            Couldn&apos;t load feed
          </Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListHeaderComponent={<StoryBar />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={{
            paddingTop: insets.top + webTopInset + headerHeight,
            paddingBottom: insets.bottom + webBottomInset + 16,
          }}
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 80 }]}>
              <Feather name="image" size={32} color={colors.mutedForeground} />
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                No posts yet
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: { flex: 1, flexDirection: "row", alignItems: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: { padding: 6 },
  logoImg: { width: 24, height: 24 },
  brand: { fontFamily: "Outfit_700Bold", fontSize: 20, lineHeight: 22 },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
