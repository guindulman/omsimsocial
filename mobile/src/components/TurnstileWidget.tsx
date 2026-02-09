import React from 'react';
import { View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';

type TurnstileMessage =
  | { type: 'turnstile_status'; required: boolean; configured: boolean }
  | { type: 'turnstile_token'; token: string }
  | { type: 'turnstile_expired' }
  | { type: 'turnstile_error' };

type Props = {
  url: string;
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  onStatus?: (status: { required: boolean; configured: boolean }) => void;
};

const parseMessage = (raw: string): TurnstileMessage | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const obj = parsed as Record<string, unknown>;
    if (obj.type === 'turnstile_status' && typeof obj.required === 'boolean' && typeof obj.configured === 'boolean') {
      return { type: 'turnstile_status', required: obj.required, configured: obj.configured };
    }
    if (obj.type === 'turnstile_token' && typeof obj.token === 'string') {
      return { type: 'turnstile_token', token: obj.token };
    }
    if (obj.type === 'turnstile_expired') {
      return { type: 'turnstile_expired' };
    }
    if (obj.type === 'turnstile_error') {
      return { type: 'turnstile_error' };
    }
    return null;
  } catch {
    return null;
  }
};

export const TurnstileWidget = ({ url, onToken, onExpired, onError, onStatus }: Props) => {
  const handleMessage = React.useCallback(
    (event: WebViewMessageEvent) => {
      const msg = parseMessage(event.nativeEvent.data);
      if (!msg) {
        return;
      }

      switch (msg.type) {
        case 'turnstile_status':
          onStatus?.({ required: msg.required, configured: msg.configured });
          break;
        case 'turnstile_token':
          onToken(msg.token);
          break;
        case 'turnstile_expired':
          onExpired?.();
          break;
        case 'turnstile_error':
          onError?.();
          break;
        default:
          break;
      }
    },
    [onError, onExpired, onStatus, onToken]
  );

  return (
    <View style={{ height: 140, width: '100%', overflow: 'hidden', borderRadius: 12 }}>
      <WebView
        source={{ uri: url }}
        onMessage={handleMessage}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        setSupportMultipleWindows={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  );
};

