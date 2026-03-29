import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  AI_CHAT_REPLY_MAX_LENGTH,
  AI_DESCRIPTION_MAX_LENGTH,
  MAX_IMAGE_SIZE,
} from "@snap-cals/shared";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ActionSheet from "@/components/action-sheet";
import Button from "@/components/button";
import KeyboardAwareView from "@/components/keyboard-aware-view";
import { useSnackbar } from "@/components/snackbar";
import ThemedSwitch from "@/components/themed-switch";
import { useColors } from "@/contexts/theme-context";
import { useSettingsStore } from "@/stores/settings.store";
import { borderRadius, fontSize, spacing } from "@/theme";
import ChatView from "./chat-view";
import { useAiAssist } from "./use-ai-assist";
import { useChat } from "./use-chat";
import { useImagePicker } from "./use-image-picker";

export default function AiAssistScreen() {
  const colors = useColors();
  const { show } = useSnackbar();
  const assist = useAiAssist((msg) => show(msg, "error"));
  const chat = useChat();
  const { image, pickFromCamera, pickFromGallery, clearImage } =
    useImagePicker();
  const globalDefault = useSettingsStore((s) => s.discussionMode);
  const [discussionMode, setDiscussionMode] = useState(globalDefault);
  const [chatStarted, setChatStarted] = useState(false);
  const [reply, setReply] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const imageData = image
    ? { base64: image.base64, mimeType: image.mimeType }
    : undefined;

  // Keep stable refs so the focus-effect cleanup never re-fires mid-render
  const clearImageRef = useRef(clearImage);
  clearImageRef.current = clearImage;
  const resetChatRef = useRef(chat.reset);
  resetChatRef.current = chat.reset;

  // Reset ephemeral state when leaving this screen (e.g. after confirming an entry)
  useFocusEffect(
    useMemo(
      () => () => {
        clearImageRef.current();
        assist.setDescription("");
        setChatStarted(false);
        setReply("");
        resetChatRef.current();
      },
      [],
    ),
  );

  // Delay picker launch so the ActionSheet modal fully dismisses first —
  // on iOS, the system photo picker conflicts with an in-progress modal animation
  const handlePickImage = (picker: () => Promise<void>) => () => {
    setTimeout(() => picker(), 500);
  };

  const sheetOptions = [
    {
      label: "Take Photo",
      icon: "camera-outline" as const,
      onPress: handlePickImage(pickFromCamera),
    },
    {
      label: "Choose from Library",
      icon: "images-outline" as const,
      onPress: handlePickImage(pickFromGallery),
    },
  ];

  const canEstimate = !!(assist.description.trim() || image);

  const handleEstimate = () => {
    if (image && image.base64.length > MAX_IMAGE_SIZE) {
      show("Image is too large, try a smaller photo", "error");
      return;
    }
    if (discussionMode) {
      setChatStarted(true);
      chat.sendMessage(
        assist.description.trim() || "Estimate the nutrition of this food",
        false,
        imageData,
        image?.uri,
      );
      clearImage();
    } else {
      assist.estimate(imageData).then(clearImage);
    }
  };

  // Chat mode active
  if (discussionMode && chatStarted) {
    return (
      <KeyboardAwareView
        style={styles.container}
        edges={["bottom"]}
        keyboardVerticalOffset={100}
      >
        <ChatView messages={chat.messages} imageUri={chat.imageUri} />
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
            onPress={() => {
              const text = reply.trim();
              if (!text) return;
              setReply("");
              chat.sendMessage(text);
            }}
            disabled={!reply.trim()}
            loading={chat.loading}
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
      </KeyboardAwareView>
    );
  }

  // Initial input mode (both discussion and one-shot)
  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="e.g. Big Mac from McDonald's"
          placeholderTextColor={colors.textSecondary}
          value={assist.description}
          onChangeText={assist.setDescription}
          maxLength={AI_DESCRIPTION_MAX_LENGTH}
          multiline
          autoFocus
          editable={!assist.loading}
        />
        <TouchableOpacity
          style={[styles.cameraButton, { borderColor: colors.border }]}
          onPress={() => setSheetVisible(true)}
          disabled={assist.loading}
          testID="camera-button"
        >
          <Ionicons name="camera-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {assist.description.length >= AI_DESCRIPTION_MAX_LENGTH * 0.8 && (
        <Text
          style={[
            styles.charCount,
            assist.description.length >= AI_DESCRIPTION_MAX_LENGTH &&
              styles.charCountLimit,
          ]}
        >
          {assist.description.length}/{AI_DESCRIPTION_MAX_LENGTH}
        </Text>
      )}
      {image && (
        <View style={styles.previewRow}>
          <Image source={{ uri: image.uri }} style={styles.thumbnail} />
          <TouchableOpacity style={styles.removeButton} onPress={clearImage}>
            <Ionicons name="close-circle" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Discussion Mode</Text>
        <ThemedSwitch
          value={discussionMode}
          onValueChange={setDiscussionMode}
        />
      </View>
      <Text style={styles.toggleHint}>
        AI will ask clarifying questions before estimating
      </Text>
      <Button
        title="Estimate"
        onPress={handleEstimate}
        disabled={!canEstimate}
        loading={assist.loading}
      />
      <Text style={styles.disclaimer}>
        AI estimates may not be exact — review before saving
      </Text>
      <ActionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        options={sheetOptions}
      />
    </View>
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
      alignItems: "flex-start",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      minHeight: 80,
      textAlignVertical: "top",
      borderWidth: 1,
      borderColor: colors.border,
    },
    cameraButton: {
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    thumbnail: { width: 80, height: 80, borderRadius: borderRadius.md },
    removeButton: { marginLeft: spacing.xs },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleLabel: { color: colors.text, fontSize: fontSize.md },
    toggleHint: {
      color: colors.textSecondary,
      fontSize: fontSize.sm,
      marginBottom: spacing.md,
    },
    charCount: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      marginBottom: spacing.xs,
    },
    charCountLimit: { color: colors.error },
    chatInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
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
    disclaimer: {
      color: colors.textSecondary,
      fontSize: fontSize.xs,
      textAlign: "center",
      marginTop: spacing.lg,
    },
  });
