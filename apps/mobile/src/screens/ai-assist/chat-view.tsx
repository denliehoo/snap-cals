import type { ChatMessage } from "@snap-cals/shared";
import { useMemo, useRef } from "react";
import { FlatList, Image, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/contexts/theme-context";
import { borderRadius, fontSize, spacing } from "@/theme";

interface ChatViewProps {
  messages: ChatMessage[];
  imageUri?: string | null;
}

export default function ChatView({ messages, imageUri }: ChatViewProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listRef = useRef<FlatList>(null);

  const scrollToBottom = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(_, i) => String(i)}
      contentContainerStyle={{ paddingTop: spacing.md }}
      onContentSizeChange={scrollToBottom}
      onLayout={scrollToBottom}
      ListHeaderComponent={
        imageUri ? (
          <View style={styles.imageRow}>
            <Image source={{ uri: imageUri }} style={styles.chatImage} />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const isUser = item.role === "user";
        return (
          <View
            style={[
              styles.bubble,
              isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                isUser ? styles.userText : styles.aiText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        );
      }}
    />
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    imageRow: { alignItems: "flex-end", marginBottom: spacing.md },
    chatImage: { width: 150, height: 150, borderRadius: borderRadius.md },
    bubble: {
      maxWidth: "80%",
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
    },
    userBubble: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
    },
    aiBubble: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: { fontSize: fontSize.md },
    userText: { color: colors.textOnPrimary },
    aiText: { color: colors.text },
  });
