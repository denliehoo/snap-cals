import { AI_CHAT_REPLY_MAX_LENGTH } from "@snap-cals/shared";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "@/components/button";
import KeyboardAwareView from "@/components/keyboard-aware-view";
import { useColors } from "@/contexts/theme-context";
import ChatView from "@/screens/ai-assist/chat-view";
import { borderRadius, fontSize, spacing } from "@/theme";
import { useGoalCoach } from "./use-goal-coach";

export default function GoalCoachScreen() {
  const colors = useColors();
  const { messages, loading, recommendation, sendMessage, confirm } =
    useGoalCoach();
  const [reply, setReply] = useState("");
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <KeyboardAwareView
      style={styles.container}
      edges={["bottom"]}
      keyboardVerticalOffset={100}
    >
      <ChatView messages={messages} />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Reply..."
          placeholderTextColor={colors.textSecondary}
          value={reply}
          onChangeText={setReply}
          maxLength={AI_CHAT_REPLY_MAX_LENGTH}
          editable={!loading}
        />
        <Button
          title="Send"
          onPress={() => {
            const text = reply.trim();
            if (!text) return;
            setReply("");
            sendMessage(text);
          }}
          disabled={!reply.trim()}
          loading={loading}
        />
      </View>
      {reply.length >= AI_CHAT_REPLY_MAX_LENGTH * 0.8 && (
        <Text
          style={[
            styles.charCount,
            reply.length >= AI_CHAT_REPLY_MAX_LENGTH && styles.charCountLimit,
          ]}
        >
          {reply.length}/{AI_CHAT_REPLY_MAX_LENGTH}
        </Text>
      )}
      {recommendation && (
        <View style={styles.confirmRow}>
          <Button title="Set as my goals" onPress={confirm} />
        </View>
      )}
    </KeyboardAwareView>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      fontSize: fontSize.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmRow: { paddingVertical: spacing.md },
    charCount: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      marginTop: spacing.xs,
    },
    charCountLimit: { color: colors.error },
  });
