import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

import { api } from '../../api';
import { useOnboardingStore } from '../../state/onboardingStore';
import { useAuthStore } from '../../state/authStore';

type Mode = 'text' | 'photo' | 'voice';
type RouteParams = { mode?: Mode | 'video' };

export const CreateEditorScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const modeParam = (route.params as RouteParams | undefined)?.mode ?? 'text';
  const mode: Mode = modeParam === 'video' ? 'photo' : modeParam;
  const queryClient = useQueryClient();
  const markPostedMemory = useOnboardingStore((state) => state.markPostedMemory);
  const currentUser = useAuthStore((state) => state.user);

  const [scope, setScope] = useState<'circle' | 'direct' | 'private'>('circle');
  const [body, setBody] = useState('');
  const [circleId, setCircleId] = useState<number | undefined>(undefined);
  const [directUserId, setDirectUserId] = useState<number | undefined>(undefined);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const circlesQuery = useQuery({ queryKey: ['circles'], queryFn: () => api.listCircles() });
  const connectionsQuery = useQuery({ queryKey: ['connections'], queryFn: () => api.listConnections() });
  const connectionUsers =
    connectionsQuery.data?.data
      ?.map((connection) =>
        connection.requester?.id === currentUser?.id ? connection.addressee : connection.requester
      )
      .filter(Boolean) || [];

  useEffect(() => {
    if (modeParam === 'video') {
      Alert.alert('Video disabled', 'Video uploads are temporarily disabled.');
      navigation.goBack();
    }
  }, [modeParam, navigation]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await api.createMemory({
        scope,
        circle_id: scope === 'circle' ? circleId : undefined,
        direct_user_id: scope === 'direct' ? directUserId : undefined,
        body,
      });

      if (mediaUri && mode !== 'text') {
        await api.uploadMemoryMedia(response.memory.id, {
          type: mode === 'photo' ? 'image' : 'voice',
          uri: mediaUri,
        });
      }

      return response;
    },
    onSuccess: (data) => {
      markPostedMemory();
      queryClient.invalidateQueries({ queryKey: ['circleFeed'] });
      navigation.navigate('PostSuccess' as never, { memoryId: data.memory.id } as never);
    },
  });

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      exif: false,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        setMediaUri(uri);
      }
      return;
    }

    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      return;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording: newRecording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    setRecording(newRecording);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Memory</Text>
      <View style={styles.scopeRow}>
        {(['circle', 'direct', 'private'] as const).map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.scopeChip, scope === value && styles.scopeChipActive]}
            onPress={() => setScope(value)}
          >
            <Text style={scope === value ? styles.scopeActiveText : styles.scopeText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {scope === 'circle' ? (
        <View style={styles.selector}>
          <Text style={styles.label}>Circle</Text>
          <TextInput
            placeholder="Circle ID"
            style={styles.input}
            value={circleId ? String(circleId) : ''}
            onChangeText={(value) => setCircleId(Number(value))}
          />
          <Text style={styles.helper}>
            Available circles: {circlesQuery.data?.data?.map((circle) => circle.id).join(', ') || 'none'}
          </Text>
        </View>
      ) : null}
      {scope === 'direct' ? (
        <View style={styles.selector}>
          <Text style={styles.label}>Send to</Text>
          <TextInput
            placeholder="User ID"
            style={styles.input}
            value={directUserId ? String(directUserId) : ''}
            onChangeText={(value) => setDirectUserId(Number(value))}
          />
          <Text style={styles.helper}>
            Connections: {connectionUsers.map((user) => `${user?.id}:${user?.name}`).join(', ') || 'none'}
          </Text>
        </View>
      ) : null}
      <TextInput
        placeholder="Write your memory"
        style={styles.textArea}
        value={body}
        onChangeText={setBody}
        multiline
      />
      {mode === 'voice' ? (
        <TouchableOpacity style={styles.secondary} onPress={toggleRecording}>
          <Text style={styles.secondaryText}>{recording ? 'Stop recording' : 'Record voice'}</Text>
        </TouchableOpacity>
      ) : mode !== 'text' ? (
        <TouchableOpacity style={styles.secondary} onPress={pickMedia}>
          <Text style={styles.secondaryText}>{mediaUri ? 'Media selected' : 'Pick media'}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity style={styles.primary} onPress={() => createMutation.mutate()}>
        <Text style={styles.primaryText}>{createMutation.isPending ? 'Posting...' : 'Post Memory'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  scopeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scopeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  scopeChipActive: {
    backgroundColor: '#111827',
  },
  scopeText: {
    color: '#6b7280',
  },
  scopeActiveText: {
    color: '#fff',
  },
  selector: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  helper: {
    color: '#9ca3af',
    fontSize: 12,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#111827',
    fontWeight: '600',
  },
  primary: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
