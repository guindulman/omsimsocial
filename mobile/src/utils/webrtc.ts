import { NativeModules } from 'react-native';

export type WebRTCModule = typeof import('react-native-webrtc');

export const hasNativeWebRTC = () => {
  const nativeModules = NativeModules as Record<string, unknown>;
  return Boolean(
    nativeModules.WebRTCModule ||
      nativeModules.RTCModule ||
      nativeModules.RTCPeerConnection ||
      nativeModules.RNWebRTC
  );
};

export const loadWebRTCModule = async (): Promise<WebRTCModule | null> => {
  if (!hasNativeWebRTC()) {
    return null;
  }

  try {
    return await import('react-native-webrtc');
  } catch {
    return null;
  }
};
