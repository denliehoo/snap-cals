import React, { useMemo, useState } from "react";
import { View, TextInput, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { spacing, fontSize, borderRadius } from "@/theme";
import { useColors } from "@/contexts/theme-context";
import Button from "@/components/button";
import { useAiAssist } from "./use-ai-assist";
import { useChat } from "./use-chat";
import { useSettingsStore } from "@/stores/settings.store";
import ThemedSwitch from "@/components/themed-switch";
import ChatView from "./chat-view";
import { AI_DESCRIPTION_MAX_LENGTH, AI_CHAT_REPLY_MAX_LENGTH } from "@snap-cals/shared";

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
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Reply..."
              placeholderTextColor={colors.textSecondary}
              value={reply}
              onChangeText={setReply}
              maxLength={AI_CHAT_REPLY_MAX_LENGTH}
              editable={!chat.loading}
            />
            <Button
              title="Send"
              onPress={sendReply}
              disabled={!reply.trim()}
              loading={chat.loading}
            />
          </View>
          {reply.length >= AI_CHAT_REPLY_MAX_LENGTH * 0.8 && (
            <Text style={[styles.charCount, reply.length >= AI_CHAT_REPLY_MAX_LENGTH && styles.charCountLimit]}>
              {reply.length}/{AI_CHAT_REPLY_MAX_LENGTH}
            </Text>
          )}
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
        maxLength={AI_DESCRIPTION_MAX_LENGTH}
        multiline
        autoFocus
        editable={!assist.loading}
      />
      {assist.description.length >= AI_DESCRIPTION_MAX_LENGTH * 0.8 && (
        <Text style={[styles.charCount, assist.description.length >= AI_DESCRIPTION_MAX_LENGTH && styles.charCountLimit]}>
          {assist.description.length}/{AI_DESCRIPTION_MAX_LENGTH}
        </Text>
      )}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Discussion Mode</Text>
        <ThemedSwitch
          value={discussionMode}
          onValueChange={setDiscussionMode}
        />
      </View>
      <Text style={styles.toggleHint}>AI will ask clarifying questions before estimating</Text>
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
    },
    toggleLabel: { color: colors.text, fontSize: fontSize.md },
    toggleHint: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md },
    charCount: { color: colors.textSecondary, fontSize: fontSize.xs, marginBottom: spacing.xs },
    charCountLimit: { color: colors.error },
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
