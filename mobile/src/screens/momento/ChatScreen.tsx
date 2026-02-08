import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '../../components/AppText';
import { BackButton } from '../../components/BackButton';
import { MessageBubble } from '../../components/MessageBubble';
import { useTheme } from '../../theme/useTheme';
import { momentoConversations } from '../../mock/momentoData';
import { MomentoMessage, MomentoUser } from '../../types/momento';
import { api } from '../../api';
import { Message as ApiMessage } from '../../api/types';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../state/authStore';
import { getEcho } from '../../realtime/echo';
import { normalizeMediaUrl } from '../../utils/momentoAdapter';
import { hasNativeWebRTC } from '../../utils/webrtc';

type ChatRouteParams = {
  conversationId: string;
  user?: MomentoUser;
  userId?: number;
};

const EMOJI_SET = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😍',
  '😎',
  '🥳',
  '😭',
  '😤',
  '👍',
  '👏',
  '🙌',
  '🙏',
  '❤️',
  '🔥',
  '✨',
];

export const ChatScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { conversationId, user: routeUser, userId } = route.params as ChatRouteParams;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const queryClient = useQueryClient();
  const listRef = useRef<FlatList<MomentoMessage>>(null);
  const inputRef = useRef<TextInput>(null);
  const autoScrollRef = useRef({ enabled: false, animated: true });
  const initialLoadRef = useRef(true);
  const incomingCallRef = useRef<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<MomentoMessage[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputFontFamily = Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: undefined,
  });
  const canVideoCall = hasNativeWebRTC();

  const conversation = useMemo(
    () => momentoConversations.find((item) => item.id === conversationId),
    [conversationId]
  );
  const mediaItems = useMemo(
    () =>
      messages.flatMap((item, index) => {
        if (!item.mediaUrl) return [];
        return [
          {
            id: item.id ?? `media-${index}`,
            uri: item.mediaUrl,
            type: (item.mediaType ?? 'image') as 'image' | 'video',
          },
        ];
      }),
    [messages]
  );
  const conversationUser = conversation?.user ?? routeUser;
  const recipientId = useMemo(() => {
    if (typeof userId === 'number' && Number.isFinite(userId)) {
      return userId;
    }
    if (routeUser?.id) {
      const parsed = Number(routeUser.id);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }, [routeUser?.id, userId]);

  const threadQuery = useQuery({
    queryKey: ['messages', recipientId],
    queryFn: () => api.messageThread(recipientId ?? 0),
    enabled: Boolean(recipientId),
  });

  const toUiMessage = (item: ApiMessage): MomentoMessage => {
    const senderId = item.sender?.id;
    const from = senderId && senderId === currentUserId ? 'me' : item.sender?.id ?? 'me';
    return {
      id: String(item.id),
      from: String(from),
      text: item.body ?? '',
      time: new Date(item.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      mediaUrl: normalizeMediaUrl(item.media_url ?? null),
      mediaType: item.media_type ?? null,
    } as MomentoMessage;
  };

  useEffect(() => {
    if (threadQuery.data?.data) {
      if (initialLoadRef.current) {
        autoScrollRef.current = { enabled: true, animated: false };
        initialLoadRef.current = false;
      }
      setMessages(threadQuery.data.data.map(toUiMessage));
    }
  }, [threadQuery.data?.data]);

  useEffect(() => {
    if (threadQuery.isSuccess) {
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-by-sender'] });
    }
  }, [queryClient, threadQuery.isSuccess]);

  const ensureRecipient = () => {
    if (recipientId) return true;
    Alert.alert('Chat unavailable', 'Select a user to message.');
    return false;
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) {
      const payload = error.payload as { message?: string } | null;
      return payload?.message || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  };

  const sendMutation = useMutation({
    mutationFn: (payload: { body?: string; media?: { uri: string; type: 'image' } }) =>
      api.sendMessage({
        recipient_id: recipientId ?? 0,
        body: payload.body,
        media: payload.media,
      }),
    onSuccess: (response) => {
      const incoming = response.message;
      if (!incoming) return;
      autoScrollRef.current = { enabled: true, animated: true };
      setMessages((current) => {
        if (current.some((item) => item.id === String(incoming.id))) {
          return current;
        }
        return [...current, toUiMessage(incoming)];
      });
    },
    onError: (error) => {
      const messageText = getErrorMessage(error, 'Unable to send your message.');
      Alert.alert('Message failed', messageText);
    },
  });

  const deleteForMeMutation = useMutation({
    mutationFn: (messageId: number) => api.deleteMessage(messageId),
    onSuccess: () => {
      if (recipientId) {
        queryClient.invalidateQueries({ queryKey: ['messages', recipientId] });
      }
    },
    onError: (error) => {
      const messageText = getErrorMessage(error, 'Unable to delete this message.');
      Alert.alert('Delete failed', messageText);
      threadQuery.refetch();
    },
  });

  const unsendMutation = useMutation({
    mutationFn: (messageId: number) => api.unsendMessage(messageId),
    onSuccess: () => {
      if (recipientId) {
        queryClient.invalidateQueries({ queryKey: ['messages', recipientId] });
      }
    },
    onError: (error) => {
      const messageText = getErrorMessage(error, 'Unable to unsend this message.');
      Alert.alert('Unsend failed', messageText);
      threadQuery.refetch();
    },
  });

  const callRequest = useMutation({
    mutationFn: () => api.requestCall(recipientId ?? 0, 'video'),
    onSuccess: (response) => {
      const call = response.call;
      if (!call || !recipientId) return;
      navigation.navigate(
        'VideoCall' as never,
        {
          callId: call.id,
          recipientId,
          recipientName: conversationUser?.name ?? 'Call',
          isCaller: true,
        } as never
      );
    },
    onError: (error) => {
      let messageText = 'Unable to start a video call.';
      if (error instanceof ApiError) {
        const payload = error.payload as { message?: string } | null;
        messageText = payload?.message || error.message;
      } else if (error instanceof Error) {
        messageText = error.message;
      }
      Alert.alert('Call failed', messageText);
    },
  });

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (!ensureRecipient()) {
      return;
    }
    sendMutation.mutate({ body: trimmed });
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleEmojiToggle = () => {
    setShowEmojiPicker((current) => {
      const next = !current;
      if (next) {
        Keyboard.dismiss();
      }
      return next;
    });
  };

  const handleInsertEmoji = (emoji: string) => {
    setMessage((current) => `${current}${emoji}`);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleAttach = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        quality: 0.7,
        exif: false,
      });
      if (result.canceled) return;
      if (!ensureRecipient()) return;
      for (const asset of result.assets) {
        await sendMutation.mutateAsync({ media: { uri: asset.uri, type: 'image' } });
      }
    } catch {
      Alert.alert('Unable to attach', 'Please try again.');
    }
  };

  const handleVideoCall = () => {
    if (!ensureRecipient()) {
      return;
    }
    if (!canVideoCall) {
      Alert.alert(
        'Video call unavailable',
        'Video calls require a development build that includes the WebRTC module.'
      );
      return;
    }
    callRequest.mutate();
  };

  const removeLocalMessage = (messageId: string) => {
    setMessages((current) => current.filter((item) => item.id !== messageId));
  };

  const handleOpenMedia = (messageId: string) => {
    if (!mediaItems.length) return;
    const index = mediaItems.findIndex((item) => item.id === messageId);
    navigation.navigate(
      'MediaViewer' as never,
      {
        mediaItems,
        initialIndex: index >= 0 ? index : 0,
      } as never
    );
  };

  const handleDeleteMessage = (item: MomentoMessage, scope: 'me' | 'everyone') => {
    removeLocalMessage(item.id);
    const messageId = Number(item.id);
    if (!Number.isFinite(messageId)) {
      return;
    }
    if (scope === 'everyone') {
      unsendMutation.mutate(messageId);
      return;
    }
    deleteForMeMutation.mutate(messageId);
  };

  const handleMessageOptions = (item: MomentoMessage) => {
    const isMine = item.from === 'me' || item.from === String(currentUserId);
    const actions = [
      {
        text: 'Delete for me',
        style: 'destructive' as const,
        onPress: () => handleDeleteMessage(item, 'me'),
      },
      ...(isMine
        ? [
            {
              text: 'Unsend for everyone',
              style: 'destructive' as const,
              onPress: () => handleDeleteMessage(item, 'everyone'),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ];

    Alert.alert('Message options', 'Choose an action for this message.', actions);
  };

  useEffect(() => {
    initialLoadRef.current = true;
    autoScrollRef.current = { enabled: false, animated: true };
    incomingCallRef.current = null;
  }, [recipientId]);

  useEffect(() => {
    if (!currentUserId) return;
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.private(`user.${currentUserId}`);
    const handler = (event: { message?: ApiMessage }) => {
      const incoming = event.message;
      if (!incoming) return;
      const incomingSenderId = incoming.sender?.id;
      const incomingRecipientId = incoming.recipient?.id;
      if (!recipientId || !currentUserId || !incomingSenderId || !incomingRecipientId) return;
      const isRelated =
        (incomingSenderId === recipientId && incomingRecipientId === currentUserId) ||
        (incomingSenderId === currentUserId && incomingRecipientId === recipientId);
      if (!isRelated) return;
      setMessages((current) => {
        if (current.some((item) => item.id === String(incoming.id))) {
          return current;
        }
        return [...current, toUiMessage(incoming)];
      });
      if (incomingSenderId === recipientId && incomingRecipientId === currentUserId) {
        threadQuery.refetch();
      }
    };
    channel.listen('.message.sent', handler);
    return () => {
      channel.stopListening('.message.sent', handler);
    };
  }, [currentUserId, recipientId, threadQuery.refetch]);

  useEffect(() => {
    if (!currentUserId || !recipientId) return;
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.private(`user.${currentUserId}`);
    const handler = (event: {
      call_id?: number;
      event?: string;
      from_user_id?: number;
      data?: { call?: { id?: number } };
    }) => {
      if (event.event !== 'request') return;
      if (event.from_user_id !== recipientId) return;
      const callId = event.call_id ?? event.data?.call?.id;
      if (!callId) return;
      if (incomingCallRef.current === callId) return;
      incomingCallRef.current = callId;
      if (!canVideoCall) {
        api.declineCall(callId).catch(() => undefined);
        Alert.alert(
          'Video call unavailable',
          'Video calls require a development build that includes the WebRTC module.'
        );
        return;
      }
      Alert.alert(
        conversationUser?.name ?? 'Incoming call',
        'Incoming video call.',
        [
          {
            text: 'Decline',
            style: 'destructive',
            onPress: () => {
              api.declineCall(callId).catch(() => undefined);
            },
          },
          {
            text: 'Accept',
            onPress: () => {
              api
                .acceptCall(callId)
                .then(() => {
                  navigation.navigate(
                    'VideoCall' as never,
                    {
                      callId,
                      recipientId,
                      recipientName: conversationUser?.name ?? 'Call',
                      isCaller: false,
                    } as never
                  );
                })
                .catch((error) => {
                  const messageText =
                    error instanceof ApiError
                      ? (error.payload as { message?: string } | null)?.message || error.message
                      : error instanceof Error
                      ? error.message
                      : 'Unable to accept the call.';
                  Alert.alert('Call failed', messageText);
                });
            },
          },
        ],
        { cancelable: false }
      );
    };
    channel.listen('.call.signal', handler);
    return () => {
      channel.stopListening('.call.signal', handler);
    };
  }, [canVideoCall, currentUserId, recipientId, conversationUser?.name, navigation]);

  const handleContentSizeChange = () => {
    if (!autoScrollRef.current.enabled) return;
    listRef.current?.scrollToEnd({ animated: autoScrollRef.current.animated });
    autoScrollRef.current.enabled = false;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="title">{conversationUser?.name ?? 'Chat'}</AppText>
            <AppText tone="secondary">Direct messages</AppText>
          </View>
          <Pressable
            onPress={handleVideoCall}
            accessibilityRole="button"
            accessibilityLabel="Start video call"
            disabled={callRequest.isPending || !canVideoCall}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor:
                callRequest.isPending || !canVideoCall ? theme.colors.surfaceAlt : theme.colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              opacity: callRequest.isPending || !canVideoCall ? 0.7 : 1,
            }}
          >
            <Feather name="video" size={18} color={theme.colors.textPrimary} />
          </Pressable>
        </View>
        {threadQuery.isError ? (
          <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
            <AppText tone="urgent">
              {threadQuery.error instanceof ApiError
                ? (threadQuery.error.payload as { message?: string } | null)?.message ||
                  threadQuery.error.message
                : 'Unable to load this chat.'}
            </AppText>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
          onContentSizeChange={handleContentSizeChange}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={{ paddingVertical: theme.spacing.lg, alignItems: 'center' }}>
              <AppText tone="secondary">No messages yet. Say hello.</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: theme.spacing.sm }}>
              <MessageBubble
                text={item.text}
                isMine={item.from === 'me' || item.from === String(currentUserId)}
                mediaUrl={item.mediaUrl}
                mediaType={item.mediaType}
                onPressMedia={item.mediaUrl ? () => handleOpenMedia(item.id) : undefined}
                onLongPress={() => handleMessageOptions(item)}
              />
              <AppText
                variant="caption"
                tone="secondary"
                style={{
                  alignSelf: item.from === 'me' ? 'flex-end' : 'flex-start',
                  marginTop: 2,
                }}
              >
                {item.time}
              </AppText>
            </View>
          )}
        />

        {showEmojiPicker ? (
          <View
            style={{
              marginHorizontal: theme.spacing.lg,
              marginBottom: theme.spacing.sm,
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              backgroundColor: theme.colors.surfaceAlt,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              maxHeight: 160,
            }}
          >
            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {EMOJI_SET.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleInsertEmoji(emoji)}
                  accessibilityRole="button"
                  accessibilityLabel={`Insert ${emoji}`}
                  style={{
                    width: 36,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.borderSubtle,
                  }}
                >
                  <AppText useSystemFont style={{ fontSize: 18 }}>
                    {emoji}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.sm,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              gap: theme.spacing.sm,
            }}
          >
            <Pressable
              onPress={handleEmojiToggle}
              accessibilityRole="button"
              accessibilityLabel="Open emoji picker"
            >
              <Feather
                name="smile"
                size={18}
                color={showEmojiPicker ? theme.colors.accent : theme.colors.textSecondary}
              />
            </Pressable>
            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={setMessage}
              placeholder="Write a message"
              placeholderTextColor={theme.colors.textSecondary}
              onFocus={() => setShowEmojiPicker(false)}
              style={{
                flex: 1,
                color: theme.colors.textPrimary,
                fontFamily: inputFontFamily,
                fontSize: theme.typography.body.fontSize,
              }}
            />
            <Pressable
              onPress={handleAttach}
              accessibilityRole="button"
              accessibilityLabel="Attach media"
            >
              <Feather name="paperclip" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
          <Pressable
            onPress={handleSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={!message.trim() || sendMutation.isPending}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                !message.trim() || sendMutation.isPending
                  ? theme.colors.borderSubtle
                  : theme.colors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="send" size={18} color={theme.colors.surface} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
