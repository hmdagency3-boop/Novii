import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEvent } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getReels, toggleReelLike, type Reel } from "@/lib/api";
import { formatCount } from "@/lib/utils";

export default function ReelsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const tabBarHeight = 84;
  const itemHeight = height - insets.top;
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["reels"],
    queryFn: () => getReels(20, 0),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        pagingEnabled
        snapToInterval={itemHeight}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
          setActiveIndex(i);
        }}
        renderItem={({ item, index }) => (
          <ReelItem
            reel={item}
            isActive={index === activeIndex}
            height={itemHeight}
            width={width}
            tabBarOffset={tabBarHeight + insets.bottom}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.center, { width, height: itemHeight }]}>
            <Feather name="film" size={32} color="#fff" />
            <Text style={{ color: "#fff", fontFamily: "Inter_500Medium", marginTop: 8 }}>
              No reels yet
            </Text>
          </View>
        }
      />
    </View>
  );
}

function ReelItem({
  reel,
  isActive,
  height,
  width,
  tabBarOffset,
}: {
  reel: Reel;
  isActive: boolean;
  height: number;
  width: number;
  tabBarOffset: number;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(!!reel.is_liked);
  const [count, setCount] = useState(reel.likes_count ?? 0);

  const player = useVideoPlayer(reel.video_url, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const { isPlaying } = useEvent(player, "playingChange", { isPlaying: player.playing });

  // Play/pause based on active state
  if (isActive && !isPlaying) {
    player.play();
  } else if (!isActive && isPlaying) {
    player.pause();
  }

  const onLike = async () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    try {
      await toggleReelLike(reel.id, liked);
    } catch {
      setLiked(liked);
      setCount(reel.likes_count ?? 0);
    }
  };

  const togglePlay = () => {
    if (player.playing) player.pause();
    else player.play();
  };

  return (
    <Pressable onPress={togglePlay} style={{ width, height, backgroundColor: "#000" }}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Right action rail */}
      <View style={[styles.rail, { bottom: tabBarOffset + 24 }]}>
        <Pressable onPress={onLike} style={styles.railBtn}>
          <Feather name="heart" size={30} color={liked ? "#ef4444" : "#fff"} />
          <Text style={styles.railLabel}>{formatCount(count)}</Text>
        </Pressable>
        <Pressable style={styles.railBtn}>
          <Feather name="message-circle" size={30} color="#fff" />
          <Text style={styles.railLabel}>{formatCount(reel.comments_count)}</Text>
        </Pressable>
        <Pressable style={styles.railBtn}>
          <Feather name="send" size={28} color="#fff" />
        </Pressable>
        <Pressable style={styles.railBtn}>
          <Feather name="more-vertical" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Bottom info */}
      <View style={[styles.info, { bottom: tabBarOffset + 24 }]}>
        <Pressable
          onPress={() => reel.user_id && router.push(`/user/${reel.user_id}`)}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          {reel.profile?.avatar_url ? (
            <Image source={{ uri: reel.profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#333" }]} />
          )}
          <Text style={styles.username}>{reel.profile?.username ?? "user"}</Text>
        </Pressable>
        {reel.caption ? (
          <Text style={styles.caption} numberOfLines={2}>
            {reel.caption}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  rail: { position: "absolute", right: 12, alignItems: "center", gap: 22 },
  railBtn: { alignItems: "center", gap: 4 },
  railLabel: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  info: { position: "absolute", left: 16, right: 80, gap: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16 },
  username: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  caption: { color: "#fff", fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
