import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { MediaPlaceholder } from './MediaPlaceholder';

type MessageBubbleProps = {
  text: string;
  isMine?: boolean;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  onPressMedia?: () => void;
  onLongPress?: () => void;
};

export const MessageBubble = ({
  text,
  isMine = false,
  mediaUrl,
  mediaType,
  onPressMedia,
  onLongPress,
}: MessageBubbleProps) => {
  const theme = useTheme();
  const [mediaFailed, setMediaFailed] = React.useState(false);
  const hasLongPress = Boolean(onLongPress);
  const hasMediaAction = Boolean(onPressMedia || onLongPress);
  const Container = hasLongPress ? Pressable : View;
  const MediaWrapper = hasMediaAction ? Pressable : View;

  const containerProps = hasLongPress ? { onLongPress, delayLongPress: 250 } : {};
  const mediaProps = hasMediaAction
    ? {
        onPress: onPressMedia,
        onLongPress,
        delayLongPress: 250,
        accessibilityRole: 'button' as const,
        accessibilityLabel: 'Open media',
      }
    : {};

  React.useEffect(() => {
    setMediaFailed(false);
  }, [mediaType, mediaUrl]);

  return (
    <Container
      {...containerProps}
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        backgroundColor: isMine ? theme.colors.accentSoft : theme.colors.surfaceGlassStrong,
        borderRadius: theme.radii.card,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        maxWidth: '80%',
        borderWidth: 1,
        borderColor: isMine ? theme.colors.accentGlow : theme.colors.borderSubtle,
      }}
    >
      {mediaUrl ? (
        mediaType === 'video' ? (
          <MediaWrapper {...mediaProps}>
            {mediaFailed ? (
              <MediaPlaceholder type="video" style={{ width: 220, height: 220, borderRadius: theme.radii.md }} />
            ) : (
              <Video
                source={{ uri: mediaUrl }}
                style={{ width: 220, height: 220, borderRadius: theme.radii.md }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false}
                isMuted
                onError={() => setMediaFailed(true)}
              />
            )}
          </MediaWrapper>
        ) : (
          <MediaWrapper {...mediaProps}>
            {mediaFailed ? (
              <MediaPlaceholder type="image" style={{ width: 220, height: 220, borderRadius: theme.radii.md }} />
            ) : (
              <Image
                source={{ uri: mediaUrl }}
                style={{ width: 220, height: 220, borderRadius: theme.radii.md }}
                resizeMode="cover"
                onError={() => setMediaFailed(true)}
              />
            )}
          </MediaWrapper>
        )
      ) : null}
      {text ? (
        <AppText
          useSystemFont
          style={{
            marginTop: mediaUrl ? theme.spacing.sm : 0,
            lineHeight: theme.typography.body.fontSize * 1.45,
          }}
        >
          {text}
        </AppText>
      ) : null}
    </Container>
  );
};
