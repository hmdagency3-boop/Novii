import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getExplorePosts } from "@/lib/api";

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 84 : 0;
  const tile = (width - 4) / 3;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["explore"],
    queryFn: () => getExplorePosts(60),
  });

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
        <Text style={[styles.title, { color: colors.foreground }]}>Explore</Text>
        <Pressable onPress={() => router.push("/(tabs)/search")} hitSlop={8}>
          <Feather name="search" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            Couldn&apos;t load
          </Text>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          numColumns={3}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingTop: insets.top + webTopInset + 52,
            paddingBottom: insets.bottom + webBottomInset + 16,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push(`/post/${item.id}`)}
              style={{
                width: tile,
                height: tile,
                marginRight: index % 3 === 2 ? 0 : 2,
                backgroundColor: colors.muted,
              }}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={[styles.center, { paddingTop: 80 }]}>
              <Feather name="compass" size={32} color={colors.mutedForeground} />
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                Nothing to explore yet
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
  title: { fontFamily: "Outfit_700Bold", fontSize: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
