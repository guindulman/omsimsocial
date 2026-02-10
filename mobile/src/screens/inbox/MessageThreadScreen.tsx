import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../../api';
import { EmptyState } from '../../components/EmptyState';
import { useAuthStore } from '../../state/authStore';
import { decryptDmBody, encryptDmBodyV1 } from '../../e2ee/dm';
import { useDmE2eeKeyPair } from '../../e2ee/useDmE2eeKeyPair';
import { Message as ApiMessage } from '../../api/types';

export const MessageThreadScreen = () => {
  const route = useRoute();
  const { userId } = route.params as { userId: number };
  const [text, setText] = useState('');
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const dmE2ee = useDmE2eeKeyPair();
  const myKeyPair = dmE2ee.status === 'ready' ? dmE2ee.keyPair : null;

  const { data } = useQuery({
    queryKey: ['messages', userId],
    queryFn: () => api.messageThread(userId),
    enabled: dmE2ee.status === 'ready',
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!myKeyPair || !currentUser?.id) {
        throw new Error(dmE2ee.status === 'error' ? dmE2ee.error : 'Encrypted messaging not ready.');
      }
      const recipientKey = await api.e2eeKey(userId);
      const e2eePayload = await encryptDmBodyV1(body, myKeyPair, recipientKey.public_key);
      return api.sendMessage({ recipient_id: userId, e2ee: e2eePayload });
    },
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', userId] });
    },
    onError: (error) => {
      const messageText =
        error instanceof Error ? error.message : 'Unable to send your message.';
      Alert.alert('Message failed', messageText);
    },
  });

  const messages = (data?.data ?? []) as ApiMessage[];

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender?.id === currentUser?.id ? styles.bubbleMe : styles.bubbleThem,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.sender?.id === currentUser?.id ? styles.bubbleTextMe : styles.bubbleTextThem,
              ]}
            >
              {myKeyPair && currentUser?.id ? decryptDmBody(item, currentUser.id, myKeyPair) : item.body}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No messages yet"
            subtitle="Say hello to start the conversation."
            ctaLabel="Send Hello"
            onPress={() => sendMutation.mutate('Hello!')}
          />
        }
      />
      <View style={styles.composer}>
        <TextInput
          placeholder="Write a message"
          style={styles.input}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.send} onPress={() => sendMutation.mutate(text)} disabled={!text}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#111827',
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
  },
  bubbleText: {
    color: '#111827',
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTextThem: {
    color: '#111827',
  },
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  send: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});
