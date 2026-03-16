import React, { useMemo, useState } from "react";
import { View, TextInput, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, fontSize, borderRadius } from "../../theme";
import { useColors } from "../../contexts/theme-context";
import Button from "../../components/button";
import { useAiAssist } from "./use-ai-assist";
import { useChat } from "./use-chat";
import { useSettingsStore } from "../../stores/settings.store";
import ThemedSwitch from "../../components/themed-switch";
import ChatView from "./chat-view";

export default function AiAssistScreen() {
  const colors = useColors();
  const assist = useAiAssist();
  const chat = useChat();
  const globalDefault = useSettingsStore((s) => s.discussionMode);
  const [discussionMode, setDiscussionMode] = useState(globalDefault);
  const [chatStarted, setChatStarted] = useState(false);
  const [reply, setReply] = useState("");
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const startChat = () => {
    const text = assist.description.trim();
    if (!text) return;
    setChatStarted(true);
    chat.sendMessage(text);
  };

  const sendReply = () => {
    const text = reply.trim();
    if (!text) return;
    setReply("");
    chat.sendMessage(text);
  };

  // Chat mode active
  if (discussionMode && chatStarted) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={100}
        >
          <ChatView messages={chat.messages} />
          {chat.error && <Text style={styles.error}>{chat.error}</Text>}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Reply..."
              placeholderTextColor={colors.textSecondary}
              value={reply}
              onChangeText={setReply}
              editable={!chat.loading}
            />
            <Button
              title="Send"
              onPress={sendReply}
              disabled={!reply.trim()}
              loading={chat.loading}
            />
          </View>
          {chat.estimate ? (
            <View style={styles.confirmRow}>
              <Button title="Confirm Estimate" onPress={chat.confirm} />
            </View>
          ) : (
            <Button
              title="Get Estimate"
              variant="text"
              onPress={() => chat.sendMessage("", true)}
              disabled={chat.loading}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Initial input mode (both discussion and one-shot)
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder='e.g. "grande oat milk latte" or "2 eggs on toast"'
        placeholderTextColor={colors.textSecondary}
        value={assist.description}
        onChangeText={assist.setDescription}
        multiline
        autoFocus
        editable={!assist.loading}
      />
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Discussion Mode</Text>
        <ThemedSwitch
          value={discussionMode}
          onValueChange={setDiscussionMode}
        />
      </View>
      {assist.error && <Text style={styles.error}>{assist.error}</Text>}
      <Button
        title="Estimate"
        onPress={discussionMode ? startChat : assist.estimate}
        disabled={!assist.description.trim()}
        loading={assist.loading}
      />
      <Text style={styles.disclaimer}>AI estimates may not be exact — review before saving</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingBottom: spacing.xl },
    flex: { flex: 1 },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    error: { color: colors.error, fontSize: fontSize.sm, marginBottom: spacing.sm },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    toggleLabel: { color: colors.text, fontSize: fontSize.md },
    chatInputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
    confirmRow: { paddingVertical: spacing.md },
    chatInput: {
      flex: 1,
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      fontSize: fontSize.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    disclaimer: { color: colors.textSecondary, fontSize: fontSize.xs, textAlign: "center", marginTop: spacing.lg },
  });
