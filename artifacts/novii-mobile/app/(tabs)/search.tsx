import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
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
import { getExplorePosts, searchProfiles } from "@/lib/api";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [q, setQ] = useState("");

  const { data: results = [] } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchProfiles(q),
    enabled: q.trim().length > 0,
  });

  const { data: explore = [] } = useQuery({
    queryKey: ["explore"],
    queryFn: () => getExplorePosts(45),
    enabled: q.trim().length === 0,
  });

  const tile = (width - 4) / 3;
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 84 : 0;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background, paddingTop: insets.top + webTopInset }]}>
      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: colors.foreground }]}
        />
        {q ? (
          <Pressable onPress={() => setQ("")} hitSlop={8}>
            <Feather name="x-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
      </View>

      {q.trim().length > 0 ? (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 16 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/user/${item.id}`)} style={styles.row}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
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
                    {item.username}
                  </Text>
                  {item.is_verified ? (
                    <Feather name="check-circle" size={12} color={colors.primary} />
                  ) : null}
                </View>
                {item.full_name ? (
                  <Text style={[styles.fullName, { color: colors.mutedForeground }]}>
                    {item.full_name}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                No results
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={explore}
          keyExtractor={(p) => p.id}
          numColumns={3}
          contentContainerStyle={{ paddingBottom: insets.bottom + webBottomInset + 16 }}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => router.push(`/post/${item.id}`)}
              style={{
                width: tile,
                height: tile,
                marginRight: (index + 1) % 3 === 0 ? 0 : 2,
                marginBottom: 2,
                backgroundColor: colors.muted,
              }}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: tile, height: tile }}
                  contentFit="cover"
                />
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  username: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  fullName: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  empty: { alignItems: "center", paddingTop: 80 },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
