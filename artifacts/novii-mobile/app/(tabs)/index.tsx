import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "@/components/PostCard";
import { useColors } from "@/hooks/useColors";
import { getFeed } from "@/lib/api";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: () => getFeed(20, 0),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["feed"] });
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <LinearGradient
            colors={["#7c3aed", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}
          >
            <Text style={styles.logoText}>n</Text>
          </LinearGradient>
          <Text style={[styles.brand, { color: colors.foreground }]}>
            Novii
          </Text>
        </View>
        <Feather name="heart" size={22} color={colors.foreground} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            Couldn't load feed
          </Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={{
            paddingTop: insets.top + webTopInset + headerHeight + 8,
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
  logo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 18, lineHeight: 20 },
  brand: { fontFamily: "Inter_700Bold", fontSize: 22 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
