import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { createPost } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

export default function CreateScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo library access");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!imageUri) {
      Alert.alert("Pick a photo first");
      return;
    }
    setBusy(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const url = await uploadToCloudinary(imageUri, "posts", "image");
      await createPost(caption.trim(), url);
      await qc.invalidateQueries({ queryKey: ["feed"] });
      await qc.invalidateQueries({ queryKey: ["userPosts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setImageUri(null);
      setCaption("");
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Failed to create post", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setBusy(false);
    }
  };

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 84 : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopInset + 12,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            setImageUri(null);
            setCaption("");
          }}
          hitSlop={8}
        >
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>New post</Text>
        <Pressable onPress={submit} disabled={busy || !imageUri} hitSlop={8}>
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.share,
                { color: imageUri ? colors.primary : colors.mutedForeground },
              ]}
            >
              Share
            </Text>
          )}
        </Pressable>
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + webBottomInset + 16 }]}>
        <Pressable
          onPress={pickImage}
          style={[
            styles.imageBox,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={36} color={colors.mutedForeground} />
              <Text style={[styles.muted, { color: colors.mutedForeground }]}>
                Tap to choose a photo
              </Text>
            </View>
          )}
        </Pressable>

        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a caption..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          style={[
            styles.captionInput,
            {
              color: colors.foreground,
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  share: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  content: { padding: 16, gap: 14 },
  imageBox: {
    aspectRatio: 1,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", gap: 8 },
  captionInput: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  muted: { fontFamily: "Inter_500Medium", fontSize: 14 },
});
