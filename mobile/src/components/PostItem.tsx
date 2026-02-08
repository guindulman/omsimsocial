import React from 'react';
import { Dimensions, Image, LayoutChangeEvent, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

import { MomentoMedia, MomentoPost, MomentoUser } from '../types/momento';
import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Avatar } from './Avatar';
import { Card } from './Card';
import { TextPostCover } from './TextPostCover';
import { firstName } from '../utils/name';

type PostItemProps = {
  post: MomentoPost;
  onLike?: () => void;
  onBuild?: () => void;
  onComment?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onPressUser?: () => void;
  onPressTaggedUser?: (user: MomentoUser) => void;
  onShowTaggedUsers?: (users: MomentoUser[]) => void;
  onPressMedia?: (media?: MomentoMedia, index?: number) => void;
  onShowLikes?: () => void;
  onReshare?: () => void;
  onMore?: () => void;
  onShowResharers?: () => void;
  followState?: 'none' | 'requested' | 'following';
  onFollow?: () => void;
};

export const PostItem = ({
  post,
  onLike,
  onBuild,
  onComment,
  onSave,
  onShare,
  onPressUser,
  onPressTaggedUser,
  onShowTaggedUsers,
  onPressMedia,
  onShowLikes,
  onReshare,
  onMore,
  onShowResharers,
  followState,
  onFollow,
}: PostItemProps) => {
  const theme = useTheme();
  const mediaItems = post.mediaItems?.length ? post.mediaItems : post.media ? [post.media] : [];
  const hasMedia = mediaItems.length > 0;
  const canScrollMedia = mediaItems.length > 1;
  const [mediaWidth, setMediaWidth] = React.useState<number | null>(null);
  const [mediaIndex, setMediaIndex] = React.useState(0);
  const [isCaptionExpanded, setIsCaptionExpanded] = React.useState(false);
  const [isReshareExpanded, setIsReshareExpanded] = React.useState(false);
  const actionHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
  const canLike = Boolean(onLike);
  const canComment = Boolean(onComment);
  const canReshare = Boolean(onReshare);
  const canSave = Boolean(onSave);
  const canShare = Boolean(onShare);
  const canShowLikes = Boolean(onShowLikes);
  const locationLabel = post.location ? ` - ${post.location}` : '';
  const taggedUsers = post.taggedUsers ?? [];
  const visibleTaggedUsers = taggedUsers.slice(0, 5);
  const remainingTaggedCount = taggedUsers.length - visibleTaggedUsers.length;
  const reshareUsers = post.reshareUsers ?? (post.reshare ? [post.reshare.user] : []);
  const previewLimit = 5;
  const reshareTotal = post.reshareMeta?.total ?? reshareUsers.length;
  const previewLength = Math.min(previewLimit, reshareUsers.length);
  const remainingReshareCount = Math.max(0, reshareTotal - previewLength);
  const canExpandLocal = reshareUsers.length > previewLimit && !post.reshareMeta?.hasMore;
  const visibleReshareUsers =
    canExpandLocal && isReshareExpanded ? reshareUsers : reshareUsers.slice(0, previewLimit);
  const showReshareMore = remainingReshareCount > 0 || post.reshareMeta?.hasMore === true;
  const canShowReshareMore = (showReshareMore && Boolean(onShowResharers)) || canExpandLocal;
  const reshareMoreLabel =
    remainingReshareCount > 0 ? `See more (${remainingReshareCount})` : 'See more';
  const trimmedCaption = post.caption?.trim() ?? '';
  const captionWords = trimmedCaption.length ? trimmedCaption.split(/\s+/) : [];
  const shortCaption = captionWords.slice(0, 5).join(' ');
  const hasLongCaption = captionWords.length > 5;
  const shouldTruncateCaption = hasLongCaption && Boolean(onComment);
  const showFollow = typeof followState !== 'undefined';
  const followLabel = showFollow
    ? followState === 'following'
      ? 'Following'
      : followState === 'requested'
      ? 'Requested'
      : 'Follow'
    : '';
  const followDisabled = followState !== 'none';
  const fallbackWidth = Math.max(
    0,
    Dimensions.get('window').width - theme.spacing.md * 2 - theme.spacing.lg * 2
  );
  const slideWidth = mediaWidth && mediaWidth > 0 ? mediaWidth : fallbackWidth;
  const UserSection = (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      <Avatar name={post.user.name} size={46} imageSource={{ uri: post.user.avatarUrl }} />
      <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
        <AppText variant="subtitle" numberOfLines={1} ellipsizeMode="tail">
          {post.user.name}
        </AppText>
        <AppText variant="caption" tone="secondary">
          @{post.user.username} - {post.timeAgo}
          {locationLabel}
        </AppText>
      </View>
    </View>
  );

  React.useEffect(() => {
    setMediaIndex(0);
    setIsCaptionExpanded(false);
    setIsReshareExpanded(false);
  }, [post.id, mediaItems.length]);

  return (
    <Card style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.lg }}>
      {reshareUsers.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <Feather name="repeat" size={14} color={theme.colors.textSecondary} />
          <View style={{ marginLeft: 6, flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
            <AppText variant="caption" tone="secondary">
              Reshared by{' '}
            </AppText>
            {visibleReshareUsers.map((user, index) => {
              const isLast = index === visibleReshareUsers.length - 1 && remainingReshareCount <= 0;
              const displayName = firstName(user.name, user.username);
              return (
                <AppText key={user.id} variant="caption" tone="secondary">
                  {displayName}
                  {!isLast ? ', ' : ''}
                </AppText>
              );
            })}
            {canShowReshareMore ? (
              <Pressable
                onPress={() => {
                  if (showReshareMore && onShowResharers) {
                    onShowResharers();
                    return;
                  }
                  if (canExpandLocal) {
                    setIsReshareExpanded((current) => !current);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  showReshareMore && onShowResharers
                    ? 'See more reshares'
                    : isReshareExpanded
                    ? 'See fewer reshares'
                    : 'See more reshares'
                }
                hitSlop={actionHitSlop}
                style={{ marginLeft: 4 }}
              >
                <AppText variant="caption" tone="accent" style={{ textDecorationLine: 'underline' }}>
                  {showReshareMore && onShowResharers
                    ? reshareMoreLabel
                    : isReshareExpanded
                    ? 'See less'
                    : 'See more'}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        {onPressUser ? (
          <Pressable
            onPress={onPressUser}
            accessibilityRole="button"
            accessibilityLabel={`Open ${post.user.name} profile`}
            style={{ flex: 1 }}
          >
            {UserSection}
          </Pressable>
        ) : (
          UserSection
        )}
        {showFollow ? (
          <Pressable
            onPress={followDisabled ? undefined : onFollow}
            disabled={followDisabled}
            accessibilityRole="button"
            accessibilityLabel={`${followLabel} ${post.user.name}`}
            style={({ pressed }) => [
              {
                marginRight: onMore ? theme.spacing.sm : 0,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
                borderRadius: theme.radii.pill,
                borderWidth: 1,
                borderColor: theme.colors.borderSubtle,
                backgroundColor: followDisabled ? theme.colors.surface : theme.colors.accentSoft,
                opacity: followDisabled ? 0.6 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <AppText variant="caption" tone={followDisabled ? 'secondary' : 'accent'}>
              {followLabel}
            </AppText>
          </Pressable>
        ) : null}
        {onMore ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={{ padding: theme.spacing.sm }}
            onPress={onMore}
            hitSlop={actionHitSlop}
          >
            <Feather name="more-horizontal" size={18} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {hasMedia ? (
        <View
          style={{ borderRadius: theme.radii.md, overflow: 'hidden' }}
          onLayout={(event: LayoutChangeEvent) => {
            const nextWidth = Math.round(event.nativeEvent.layout.width);
            if (!nextWidth) return;
            setMediaWidth((current) => (current === nextWidth ? current : nextWidth));
          }}
        >
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={canScrollMedia}
            showsHorizontalScrollIndicator={false}
            style={{ width: '100%', height: 260 }}
            contentContainerStyle={
              slideWidth ? { width: slideWidth * mediaItems.length } : undefined
            }
            onMomentumScrollEnd={(event) => {
              if (!slideWidth) return;
              const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
              setMediaIndex(Math.max(0, Math.min(mediaItems.length - 1, nextIndex)));
            }}
          >
            {mediaItems.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => onPressMedia?.(item, index)}
                accessibilityRole={onPressMedia ? 'button' : undefined}
                accessibilityLabel={onPressMedia ? 'Open media fullscreen' : undefined}
                style={{ width: slideWidth || '100%', height: 260 }}
              >
                {item.type === 'video' ? (
                  <View>
                    <Video
                      source={{ uri: item.uri }}
                      style={{ width: '100%', height: 260 }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={false}
                      isMuted
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: 'rgba(0,0,0,0.45)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Feather name="play" size={18} color={theme.colors.surface} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width: '100%', height: 260 }}
                    resizeMode="cover"
                    accessibilityLabel="Post media"
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
          {mediaItems.length > 1 ? (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: theme.spacing.sm,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  gap: 6,
                  paddingHorizontal: theme.spacing.sm,
                  paddingVertical: 4,
                  borderRadius: theme.radii.pill,
                  backgroundColor: 'rgba(0,0,0,0.25)',
                }}
              >
                {mediaItems.map((item, index) => (
                  <View
                    key={`dot-${item.id}-${index}`}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor:
                        index === mediaIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : (
        <TextPostCover
          seed={post.coverSeed ?? post.feedKey ?? post.id}
          text={trimmedCaption}
          variant="post"
          style={{ height: 260 }}
        />
      )}

      <View style={{ marginTop: theme.spacing.md }}>
        {hasMedia && trimmedCaption.length ? (
          <AppText>
            {shouldTruncateCaption && !isCaptionExpanded
              ? `${shortCaption}...`
              : trimmedCaption}
            {shouldTruncateCaption ? (
              <AppText
                variant="caption"
                tone="accent"
                onPress={() => setIsCaptionExpanded((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={isCaptionExpanded ? 'Collapse caption' : 'Show full caption'}
                style={{ textDecorationLine: 'underline' }}
              >
                {isCaptionExpanded ? ' ...less' : ' ...more'}
              </AppText>
            ) : null}
          </AppText>
        ) : null}
        {taggedUsers.length ? (
          <View style={{ marginTop: theme.spacing.xs, flexDirection: 'row', flexWrap: 'wrap' }}>
            <AppText variant="caption" tone="secondary">
              With{' '}
            </AppText>
            {visibleTaggedUsers.map((user, index) => {
              const isLast = index === visibleTaggedUsers.length - 1 && remainingTaggedCount <= 0;
              const displayName = firstName(user.name, user.username);
              return (
                <Pressable
                  key={user.id}
                  onPress={onPressTaggedUser ? () => onPressTaggedUser(user) : undefined}
                  accessibilityRole={onPressTaggedUser ? 'button' : undefined}
                  accessibilityLabel={onPressTaggedUser ? `Open ${user.name} profile` : undefined}
                  style={{ marginRight: 4 }}
                >
                  <AppText
                    variant="caption"
                    tone="secondary"
                    style={{ textDecorationLine: onPressTaggedUser ? 'underline' : 'none' }}
                  >
                    {displayName}
                    {!isLast ? ',' : ''}
                  </AppText>
                </Pressable>
              );
            })}
            {remainingTaggedCount > 0 ? (
              <Pressable
                onPress={onShowTaggedUsers ? () => onShowTaggedUsers(taggedUsers) : undefined}
                accessibilityRole={onShowTaggedUsers ? 'button' : undefined}
                accessibilityLabel={onShowTaggedUsers ? 'See more tagged friends' : undefined}
                style={{ marginLeft: 4 }}
              >
                <AppText
                  variant="caption"
                  tone="accent"
                  style={{ textDecorationLine: onShowTaggedUsers ? 'underline' : 'none' }}
                >
                  See more ({remainingTaggedCount})
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: theme.spacing.md,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable
              onPress={canLike ? onLike : undefined}
              onLongPress={onShowLikes}
              delayLongPress={250}
              accessibilityRole={canLike ? 'button' : undefined}
              accessibilityLabel={canLike ? (post.liked ? 'Unlike post' : 'Like post') : undefined}
              hitSlop={actionHitSlop}
            >
              <Feather
                name="heart"
                size={18}
                color={post.liked ? theme.colors.urgency : theme.colors.textPrimary}
              />
            </Pressable>
            {canShowLikes ? (
              <Pressable
                onPress={onShowLikes}
                accessibilityRole="button"
                accessibilityLabel="View likes"
                hitSlop={actionHitSlop}
              >
                <AppText variant="caption">{post.likes}</AppText>
              </Pressable>
            ) : (
              <AppText variant="caption">{post.likes}</AppText>
            )}
          </View>
          <Pressable
            onPress={canComment ? onComment : undefined}
            onLongPress={onBuild}
            delayLongPress={250}
            accessibilityRole={canComment ? 'button' : undefined}
            accessibilityLabel={canComment ? 'Comment on post' : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            hitSlop={actionHitSlop}
          >
            <Feather name="message-circle" size={18} color={theme.colors.textPrimary} />
            <AppText variant="caption">{post.comments}</AppText>
          </Pressable>
          <Pressable
            onPress={canReshare ? onReshare : undefined}
            accessibilityRole={canReshare ? 'button' : undefined}
            accessibilityLabel={canReshare ? 'Reshare post' : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            hitSlop={actionHitSlop}
          >
            <Feather
              name="repeat"
              size={18}
              color={post.reshared ? theme.colors.accent : theme.colors.textPrimary}
            />
            <AppText variant="caption">{post.reshares ?? 0}</AppText>
          </Pressable>
          <Pressable
            onPress={canSave ? onSave : undefined}
            accessibilityRole={canSave ? 'button' : undefined}
            accessibilityLabel={canSave ? (post.saved ? 'Saved post' : 'Save post') : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            hitSlop={actionHitSlop}
          >
            <Feather
              name="bookmark"
              size={18}
              color={post.saved ? theme.colors.accent : theme.colors.textPrimary}
            />
            <AppText variant="caption">{post.saves ?? 0}</AppText>
          </Pressable>
        </View>
        <Pressable
          onPress={canShare ? onShare : undefined}
          accessibilityRole={canShare ? 'button' : undefined}
          accessibilityLabel={canShare ? 'Share post' : undefined}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
          hitSlop={actionHitSlop}
        >
          <Feather name="share-2" size={18} color={theme.colors.textPrimary} />
        </Pressable>
      </View>
    </Card>
  );
};
