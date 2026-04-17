import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import {
  getMessages,
  getProfile,
  markMessagesRead,
  sendMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const otherId = id as string;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", otherId],
    queryFn: () => getProfile(otherId),
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", otherId],
    queryFn: () => getMessages(otherId),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (messages.length > 0) {
      markMessagesRead(otherId).catch(() => {});
    }
  }, [messages.length, otherId]);

  useLayoutEffect(() => {
    if (profile) {
      navigation.setOptions({ title: profile.username });
    }
  }, [profile, navigation]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await sendMessage(otherId, t);
      setText("");
      qc.invalidateQueries({ queryKey: ["messages", otherId] });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: profile?.username ?? "" }} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          inverted
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
          renderItem={({ item }) => {
            const mine = item.sender_id === user?.id;
            return (
              <View style={[styles.bubbleRow, mine ? styles.mine : styles.theirs]}>
                {item.image_url && !item.image_url.startsWith("[voice]") ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.imageMsg}
                    contentFit="cover"
                  />
                ) : null}
                {item.content ? (
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: mine ? colors.primary : colors.muted,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: mine ? colors.primaryForeground : colors.foreground,
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        lineHeight: 18,
                      }}
                    >
                      {item.content}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          }}
        />
        <View
          style={[
            styles.inputBar,
            {
              borderTopColor: colors.border,
              backgroundColor: colors.background,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
            },
          ]}
        >
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={send}
            disabled={!text.trim() || sending}
            hitSlop={8}
            style={{ opacity: !text.trim() || sending ? 0.5 : 1 }}
          >
            <Feather name="send" size={22} color={colors.primary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  bubbleRow: { marginVertical: 3, maxWidth: "80%" },
  mine: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  imageMsg: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
