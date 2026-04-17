import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getUserStories, markStoryViewed } from "@/lib/api";
import { timeAgo } from "@/lib/utils";

const STORY_DURATION = 5000;

export default function StoryViewer() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["userStories", userId],
    queryFn: () => getUserStories(userId as string),
  });

  const current = stories[index];

  useEffect(() => {
    if (!current) return;
    progress.setValue(0);
    markStoryViewed(current.id).catch(() => {});
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (!finished) return;
      if (index < stories.length - 1) setIndex((i) => i + 1);
      else router.back();
    });
    return () => anim.stop();
  }, [current, index, progress, router, stories.length]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <Text style={{ color: "#fff", fontFamily: "Inter_500Medium" }}>No active stories</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold" }}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const tapLeft = () => {
    if (index > 0) setIndex(index - 1);
    else router.back();
  };
  const tapRight = () => {
    if (index < stories.length - 1) setIndex(index + 1);
    else router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Image
        source={{ uri: current.media_url }}
        style={{ width, height, backgroundColor: "#000" }}
        contentFit="contain"
      />

      {/* Progress bars */}
      <View style={[styles.progressRow, { top: insets.top + 8 }]}>
        {stories.map((_, i) => (
          <View key={i} style={styles.progressBg}>
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: "#fff",
                width:
                  i < index
                    ? "100%"
                    : i === index
                      ? progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        })
                      : "0%",
              }}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 24 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          {current.profile?.avatar_url ? (
            <Image source={{ uri: current.profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#333" }]} />
          )}
          <Text style={styles.username}>{current.profile?.username ?? "user"}</Text>
          <Text style={styles.time}>{timeAgo(current.created_at)}</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Tap zones */}
      <Pressable
        onPress={tapLeft}
        style={[styles.tapZone, { left: 0, width: width / 2 }]}
      />
      <Pressable
        onPress={tapRight}
        style={[styles.tapZone, { right: 0, width: width / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  progressRow: {
    position: "absolute",
    left: 8,
    right: 8,
    flexDirection: "row",
    gap: 4,
  },
  progressBg: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  time: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "Inter_400Regular" },
  tapZone: { position: "absolute", top: 80, bottom: 80 },
});
