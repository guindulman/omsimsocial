import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { MediaStream, RTCPeerConnection } from 'react-native-webrtc';

import { api } from '../../api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { getEcho } from '../../realtime/echo';
import { useAuthStore } from '../../state/authStore';
import { useTheme } from '../../theme/useTheme';
import { loadWebRTCModule, WebRTCModule } from '../../utils/webrtc';

type VideoCallRouteParams = {
  callId: number;
  recipientId: number;
  recipientName?: string;
  isCaller?: boolean;
};

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export const VideoCallScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { callId, recipientName, isCaller = false } = route.params as VideoCallRouteParams;
  const currentUserId = useAuthStore((state) => state.user?.id);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const offerSentRef = useRef(false);
  const endedRef = useRef(false);
  const [webrtcModule, setWebrtcModule] = useState<WebRTCModule | null>(null);
  const [webrtcReady, setWebrtcReady] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callAccepted, setCallAccepted] = useState(!isCaller);
  const callAcceptedRef = useRef(!isCaller);
  const [status, setStatus] = useState(isCaller ? 'Calling...' : 'Connecting...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadWebRTCModule()
      .then((module) => {
        if (!mounted) return;
        setWebrtcModule(module);
        setWebrtcReady(true);
        if (!module) {
          setErrorMessage('Video calls require a development build that includes WebRTC.');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setWebrtcModule(null);
        setWebrtcReady(true);
        setErrorMessage('Unable to load the WebRTC module.');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const syncLocalStream = useCallback((stream: MediaStream | null) => {
    localStreamRef.current = stream;
    setLocalStream(stream);
  }, []);

  const syncRemoteStream = useCallback((stream: MediaStream | null) => {
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
  }, []);

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const handleRemoteEnded = useCallback(
    (message: string) => {
      if (endedRef.current) return;
      endedRef.current = true;
      cleanup();
      Alert.alert('Call ended', message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    [cleanup, navigation]
  );

  const handleLocalEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    api.endCall(callId).catch(() => undefined);
    cleanup();
    navigation.goBack();
  }, [callId, cleanup, navigation]);

  const handleSignal = useCallback(
    async (signal?: { type?: string; sdp?: string; candidate?: unknown }) => {
      if (!signal?.type || !webrtcModule) return;
      const peer = peerRef.current;
      if (!peer) return;

      try {
        if (signal.type === 'offer' && signal.sdp) {
          await peer.setRemoteDescription(
            new webrtcModule.RTCSessionDescription({ type: 'offer', sdp: signal.sdp })
          );
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await api.sendCallSignal(callId, { signal: { type: 'answer', sdp: answer.sdp } });
          setCallAccepted(true);
          setStatus('Connecting...');
        } else if (signal.type === 'answer' && signal.sdp) {
          await peer.setRemoteDescription(
            new webrtcModule.RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
          );
          setStatus('Connecting...');
        } else if (signal.type === 'candidate' && signal.candidate) {
          await peer.addIceCandidate(new webrtcModule.RTCIceCandidate(signal.candidate));
        }
      } catch {
        setErrorMessage('Unable to sync the call.');
      }
    },
    [callId, webrtcModule]
  );

  const sendOffer = useCallback(async () => {
    if (!isCaller || !callAcceptedRef.current || offerSentRef.current) return;
    const peer = peerRef.current;
    if (!peer) return;

    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await api.sendCallSignal(callId, { signal: { type: 'offer', sdp: offer.sdp } });
      offerSentRef.current = true;
    } catch {
      setErrorMessage('Unable to start the call.');
    }
  }, [callId, isCaller]);

  useEffect(() => {
    callAcceptedRef.current = callAccepted;
  }, [callAccepted]);

  useEffect(() => {
    if (!webrtcModule) return;
    let mounted = true;
    const { mediaDevices, RTCPeerConnection } = webrtcModule;

    const setup = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true, video: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        syncLocalStream(stream);

        const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerRef.current = peer;

        stream.getTracks().forEach((track) => peer.addTrack(track, stream));

        peer.ontrack = (event) => {
          const remote = event.streams?.[0];
          if (remote) {
            syncRemoteStream(remote);
            setStatus('In call');
          }
        };

        peer.onicecandidate = (event) => {
          if (!event.candidate) return;
          const candidateData =
            typeof event.candidate.toJSON === 'function' ? event.candidate.toJSON() : event.candidate;
          api.sendCallSignal(callId, { signal: { type: 'candidate', candidate: candidateData } }).catch(() => undefined);
        };

        if (!isCaller) {
          setStatus('Connecting...');
        }

        if (isCaller && callAcceptedRef.current) {
          void sendOffer();
        }
      } catch {
        setErrorMessage('Unable to access camera or microphone.');
      }
    };

    setup();
    return () => {
      mounted = false;
      cleanup();
    };
  }, [callId, cleanup, isCaller, sendOffer, syncLocalStream, syncRemoteStream, webrtcModule]);

  useEffect(() => {
    if (!currentUserId) return;
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.private(`user.${currentUserId}`);
    const handler = (event: {
      call_id?: number;
      event?: string;
      data?: { signal?: { type?: string; sdp?: string; candidate?: unknown } };
    }) => {
      if (event.call_id !== callId) return;
      if (event.event === 'accept') {
        setCallAccepted(true);
        setStatus('Connecting...');
      } else if (event.event === 'decline') {
        handleRemoteEnded('Call declined.');
      } else if (event.event === 'end') {
        handleRemoteEnded('Call ended.');
      } else if (event.event === 'signal') {
        void handleSignal(event.data?.signal);
      }
    };
    channel.listen('.call.signal', handler);
    return () => {
      channel.stopListening('.call.signal', handler);
    };
  }, [callId, currentUserId, handleRemoteEnded, handleSignal]);

  useEffect(() => {
    if (!isCaller) return;
    if (!callAccepted) return;
    void sendOffer();
  }, [callAccepted, isCaller, sendOffer]);

  if (!webrtcReady) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <ActivityIndicator />
          <AppText tone="secondary">Preparing video call...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  if (!webrtcModule) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyState}>
          <AppText variant="title">Video call unavailable</AppText>
          <AppText tone="secondary">
            {errorMessage ?? 'Video calls require a development build.'}
          </AppText>
          <Button label="Go back" variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const RTCView = webrtcModule.RTCView;

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
  };

  const toggleVideo = () => {
    const next = !isVideoEnabled;
    setIsVideoEnabled(next);
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.videoStage}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        ) : (
          <View style={[styles.remoteVideo, { backgroundColor: theme.colors.surfaceAlt }]}>
            <AppText variant="subtitle">{recipientName ?? 'Video call'}</AppText>
            <AppText tone="secondary">{errorMessage ?? status}</AppText>
          </View>
        )}
        {localStream ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={[styles.localVideo, { borderColor: theme.colors.borderSubtle }]}
            objectFit="cover"
          />
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
          <AppText variant="subtitle">{recipientName ?? 'Video call'}</AppText>
          <AppText tone="secondary">{errorMessage ?? status}</AppText>
        </View>
        <View style={styles.controls}>
          <Pressable
            onPress={toggleMute}
            accessibilityRole="button"
            accessibilityLabel={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            style={[
              styles.controlButton,
              {
                backgroundColor: isMuted ? theme.colors.surfaceAlt : theme.colors.surface,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <Feather
              name={isMuted ? 'mic-off' : 'mic'}
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={toggleVideo}
            accessibilityRole="button"
            accessibilityLabel={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            style={[
              styles.controlButton,
              {
                backgroundColor: isVideoEnabled ? theme.colors.surface : theme.colors.surfaceAlt,
                borderColor: theme.colors.borderSubtle,
              },
            ]}
          >
            <Feather
              name={isVideoEnabled ? 'video' : 'video-off'}
              size={20}
              color={theme.colors.textPrimary}
            />
          </Pressable>
          <Pressable
            onPress={handleLocalEnd}
            accessibilityRole="button"
            accessibilityLabel="End call"
            style={[
              styles.controlButton,
              { backgroundColor: theme.colors.urgency, borderColor: theme.colors.urgency },
            ]}
          >
            <Feather name="phone-off" size={20} color={theme.colors.surface} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  videoStage: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  remoteVideo: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  localVideo: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 120,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
