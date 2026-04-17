import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { createStory } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function CreateStoryScreen() {
  const colors = useColors();
  const router = useRouter();
  const qc = useQueryClient();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo library access");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!imageUri) {
      pick();
      return;
    }
    setBusy(true);
    try {
      const url = await uploadToCloudinary(imageUri, "stories", "image");
      await createStory(url, "image");
      qc.invalidateQueries({ queryKey: ["stories"] });
      router.back();
    } catch (e: unknown) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <Pressable
        onPress={pick}
        style={[
          styles.box,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={{ alignItems: "center", gap: 8 }}>
            <Feather name="image" size={36} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
              Choose a photo
            </Text>
          </View>
        )}
      </Pressable>

      <Pressable
        onPress={submit}
        disabled={busy || !imageUri}
        style={[
          styles.btn,
          {
            backgroundColor: imageUri ? colors.primary : colors.muted,
            opacity: busy ? 0.6 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text
            style={{
              color: imageUri ? colors.primaryForeground : colors.mutedForeground,
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
            }}
          >
            Share story
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    aspectRatio: 9 / 16,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  image: { width: "100%", height: "100%" },
  btn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
