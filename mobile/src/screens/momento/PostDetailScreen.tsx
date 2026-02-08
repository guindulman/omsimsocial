import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { AppText } from '../../components/AppText';
import { BackButton } from '../../components/BackButton';
import { CommentItem } from '../../components/CommentItem';
import { PostItem } from '../../components/PostItem';
import { useTheme } from '../../theme/useTheme';
import { api } from '../../api';
import { ApiError } from '../../api/client';
import { formatTimeAgo } from '../../utils/time';
import { mapMemoryToMomentoPost } from '../../utils/momentoAdapter';
import { MemoryComment } from '../../api/types';
import { MomentoMedia, MomentoUser } from '../../types/momento';
import { useAuthStore } from '../../state/authStore';
import { buildSharePostPayload } from '../../utils/share';

type PostDetailParams = {
  memoryId: number;
  commentId?: number;
  focusComposer?: boolean;
};

type CommentEntry = {
  id: string;
  commentId: number | null;
  parentId: number | null;
  isLegacy: boolean;
  user: MomentoUser;
  text: string;
  createdAt: string;
  timeAgo: string;
  likesCount: number;
  isLiked: boolean;
};

export const PostDetailScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { memoryId, focusComposer, commentId } = route.params as PostDetailParams;
  const [comment, setComment] = useState('');
  const [pendingCommentId, setPendingCommentId] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveCount, setSaveCount] = useState<number | null>(null);
  const [reshared, setReshared] = useState(false);
  const [reshareCount, setReshareCount] = useState<number | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [scrollAttempts, setScrollAttempts] = useState(0);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList<CommentEntry> | null>(null);
  const scrolledToRef = useRef<number | null>(null);
  const composerRef = useRef<TextInput | null>(null);
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const memoryQuery = useQuery({
    queryKey: ['memory', memoryId],
    queryFn: () => api.getMemory(memoryId),
  });

  const memoryError = memoryQuery.error;
  const isLocked = memoryError instanceof ApiError && memoryError.status === 403;
  const canPost = memoryQuery.isSuccess && !isLocked;

  const adoptionsQuery = useQuery({
    queryKey: ['memory-adoptions', memoryId],
    queryFn: () => api.listMemoryAdoptions(memoryId),
    enabled: memoryQuery.isSuccess,
  });

  const commentsQuery = useInfiniteQuery({
    queryKey: ['memory-comments', memoryId],
    queryFn: ({ pageParam }) =>
      api.listMemoryComments(
        memoryId,
        pageParam ? { cursor: String(pageParam) } : undefined
      ),
    enabled: memoryQuery.isSuccess,
    getNextPageParam: (lastPage) => {
      if (lastPage?.has_more && lastPage.next_cursor) {
        return lastPage.next_cursor;
      }
      return undefined;
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: (payload: { body: string; parent_id?: number | null }) =>
      api.createMemoryComment(memoryId, payload),
    onSuccess: (response) => {
      setComment('');
      setEditingCommentId(null);
      setReplyTo(null);
      const created = response.data ?? response.comment;
      const createdId = created?.id;
      const nextId =
        typeof createdId === 'number'
          ? createdId
          : typeof createdId === 'string'
          ? Number(createdId)
          : null;
      if (nextId && Number.isFinite(nextId)) {
        setPendingCommentId(nextId);
      }
      queryClient.invalidateQueries({ queryKey: ['memory-comments', memoryId] });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: (payload: { id: number; body: string }) =>
      api.updateComment(payload.id, { body: payload.body }),
    onSuccess: () => {
      setComment('');
      setEditingCommentId(null);
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['memory-comments', memoryId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id: number) => api.deleteComment(id),
    onSuccess: () => {
      if (editingCommentId) {
        setEditingCommentId(null);
        setComment('');
      }
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['memory-comments', memoryId] });
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (id: number) => api.likeComment(id),
  });

  const unlikeCommentMutation = useMutation({
    mutationFn: (id: number) => api.unlikeComment(id),
  });

  const likeMutation = useMutation({
    mutationFn: () => api.reactMemory(memoryId, 'heart'),
  });

  const unlikeMutation = useMutation({
    mutationFn: () => api.unreactMemory(memoryId, 'heart'),
  });

  const saveMutation = useMutation({
    mutationFn: () => api.saveMemory(memoryId),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['vaultAdopted'] });
    },
    onError: () => {
      setSaved(false);
      setSaveCount((prev) => Math.max(0, (prev ?? 0) - 1));
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => api.unsaveMemory(memoryId),
    onSuccess: () => {
      setSaved(false);
      queryClient.invalidateQueries({ queryKey: ['vaultAdopted'] });
    },
    onError: () => {
      setSaved(true);
      setSaveCount((prev) => (prev ?? 0) + 1);
    },
  });

  const reshareMutation = useMutation({
    mutationFn: () => api.reshareMemory(memoryId),
    onSuccess: () => {
      setReshared(true);
    },
    onError: () => {
      setReshared(false);
      setReshareCount((prev) => Math.max(0, (prev ?? 0) - 1));
    },
  });

  const unreshareMutation = useMutation({
    mutationFn: () => api.unreshareMemory(memoryId),
    onSuccess: () => {
      setReshared(false);
    },
    onError: () => {
      setReshared(true);
      setReshareCount((prev) => (prev ?? 0) + 1);
    },
  });

  const post = useMemo(() => {
    if (!memoryQuery.data?.memory) return null;
    const mapped = mapMemoryToMomentoPost(memoryQuery.data.memory);
    return {
      ...mapped,
      liked,
      likes: likeCount ?? mapped.likes,
      saved,
      saves: saveCount ?? mapped.saves,
      reshared,
      reshares: reshareCount ?? mapped.reshares,
    };
  }, [likeCount, liked, memoryQuery.data, reshared, reshareCount, saved, saveCount]);

  useEffect(() => {
    if (memoryQuery.data?.memory) {
      const mapped = mapMemoryToMomentoPost(memoryQuery.data.memory);
      setLiked(Boolean(mapped.liked));
      setLikeCount(mapped.likes);
      setSaved(Boolean(memoryQuery.data.memory.is_saved));
      setSaveCount(memoryQuery.data.memory.adoptions_count ?? 0);
      setReshared(Boolean(memoryQuery.data.memory.is_reshared));
      setReshareCount(memoryQuery.data.memory.reshares_count ?? 0);
    }
  }, [memoryQuery.data?.memory]);

  const handleToggleLike = () => {
    if (likeMutation.isPending || unlikeMutation.isPending) return;
    const baseCount = likeCount ?? post?.likes ?? 0;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount(Math.max(0, baseCount + (nextLiked ? 1 : -1)));
    const rollback = () => {
      setLiked(liked);
      setLikeCount(baseCount);
    };
    if (nextLiked) {
      likeMutation.mutate(undefined, { onError: rollback });
    } else {
      unlikeMutation.mutate(undefined, { onError: rollback });
    }
  };

  const handleFocusComposer = () => {
    setEditingCommentId(null);
    setReplyTo(null);
    composerRef.current?.focus();
  };

  const handleOpenMedia = (target: typeof post, media?: MomentoMedia, index?: number) => {
    if (!target) return;
    const mediaItems = target.mediaItems?.length ? target.mediaItems : target.media ? [target.media] : [];
    const activeMedia = media ?? mediaItems[0];
    if (!activeMedia) return;
    const initialIndex =
      typeof index === 'number' && index >= 0 ? Math.min(index, mediaItems.length - 1) : 0;
    navigation.navigate(
      'MediaViewer' as never,
      {
        uri: activeMedia.uri,
        type: activeMedia.type,
        caption: target.caption,
        mediaItems,
        initialIndex,
      } as never
    );
  };

  const handleOpenProfile = (user: MomentoUser) => {
    const userId = Number(user.id);
    navigation.navigate(
      'UserProfile' as never,
      {
        userId: Number.isNaN(userId) ? undefined : userId,
        user,
      } as never
    );
  };

  const handleShowTaggedUsers = (users: MomentoUser[]) => {
    const names = users.map((userItem) => userItem.name || userItem.username).filter(Boolean);
    if (!names.length) {
      Alert.alert('Tagged friends', 'No tagged friends yet.');
      return;
    }
    Alert.alert('Tagged friends', names.join('\n'));
  };

  const handleShare = (target: typeof post) => {
    if (!target) return;
    navigation.navigate(
      'SharePost' as never,
      { post: buildSharePostPayload(target) } as never
    );
  };

  const handleShowPostLikes = async () => {
    try {
      const response = await api.listMemoryHearts(memoryId);
      const names = response.data
        ?.map((user) => user.name || user.username || 'Omsim member')
        .filter(Boolean) ?? [];
      if (!names.length) {
        return;
      }
      const preview = names.slice(0, 20).join(', ');
      const suffix = names.length > 20 ? ` +${names.length - 20} more` : '';
      Alert.alert('Loved by', `${preview}${suffix}`);
    } catch {
      Alert.alert('Unable to load likes', 'Please try again in a moment.');
    }
  };

  const handleShowCommentLikes = async (commentId: number) => {
    try {
      const response = await api.listCommentLikes(commentId);
      const names = response.data
        ?.map((user) => user.name || user.username || 'Omsim member')
        .filter(Boolean) ?? [];
      if (!names.length) {
        return;
      }
      const preview = names.slice(0, 20).join(', ');
      const suffix = names.length > 20 ? ` +${names.length - 20} more` : '';
      Alert.alert('Loved by', `${preview}${suffix}`);
    } catch {
      Alert.alert('Unable to load likes', 'Please try again in a moment.');
    }
  };

  const comments = useMemo(() => {
    const commentPages = commentsQuery.data?.pages ?? [];
    const rawComments = commentPages.flatMap((page) => page?.data ?? []);
    const realComments: CommentEntry[] = rawComments.map((item) => ({
      id: String(item.id),
      commentId: Number(item.id),
      parentId: item.parent_id ?? null,
      isLegacy: false,
      user: {
        id: String(item.user?.id ?? item.id),
        name: item.user?.name ?? 'Omsim Friend',
        username: item.user?.username ?? 'friend',
        avatarUrl:
          item.user?.profile?.avatar_url ??
          `https://i.pravatar.cc/200?img=${(item.user?.id ?? item.id) % 70}`,
      } as MomentoUser,
      text: item.body ?? '',
      createdAt: item.created_at,
      timeAgo: formatTimeAgo(item.created_at),
      likesCount: item.likes_count ?? 0,
      isLiked: Boolean(item.is_liked),
    }));

    const legacyNotes: CommentEntry[] =
      adoptionsQuery.data?.data
        ?.filter((adoption) => adoption.note)
        .map((adoption) => ({
          id: `legacy-${adoption.id}`,
          commentId: null,
          parentId: null,
          isLegacy: true,
          user: {
            id: String(adoption.user?.id ?? adoption.id),
            name: adoption.user?.name ?? 'Omsim Friend',
            username: adoption.user?.username ?? 'friend',
            avatarUrl:
              adoption.user?.profile?.avatar_url ??
              `https://i.pravatar.cc/200?img=${(adoption.user?.id ?? adoption.id) % 70}`,
          } as MomentoUser,
          text: adoption.note ?? '',
          createdAt: adoption.created_at,
          timeAgo: formatTimeAgo(adoption.created_at),
          likesCount: 0,
          isLiked: false,
        })) ?? [];

    type CommentNode = CommentEntry & { children: CommentNode[] };

    const nodes = new Map(
      realComments.map((comment) => [comment.id, { ...comment, children: [] as CommentNode[] }])
    );
    const roots: CommentNode[] = [];

    nodes.forEach((node) => {
      if (node.parentId && nodes.has(String(node.parentId))) {
        nodes.get(String(node.parentId))?.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const legacyRoots = legacyNotes.map((note) => ({ ...note, children: [] as CommentNode[] }));
    const combinedRoots = [...legacyRoots, ...roots].sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );

    const flattened: Array<CommentEntry & { depth: number }> = [];
    const walk = (node: CommentNode, depth: number) => {
      flattened.push({ ...node, depth });
      node.children
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .forEach((child) => walk(child, depth + 1));
    };

    combinedRoots.forEach((node) => walk(node, 0));
    return flattened;
  }, [adoptionsQuery.data, commentsQuery.data]);

  const targetCommentId = pendingCommentId ?? (commentId ? Number(commentId) : null);
  const isPendingScroll = pendingCommentId !== null;
  const targetIndex = useMemo(() => {
    if (!targetCommentId) return -1;
    return comments.findIndex((entry) => entry.commentId === targetCommentId);
  }, [comments, targetCommentId]);

  useEffect(() => {
    if (!targetCommentId) return;
    setScrollAttempts(0);
    setHighlightedId(null);
    scrolledToRef.current = null;
  }, [memoryId, targetCommentId]);

  useEffect(() => {
    if (!targetCommentId) return;
    if (scrolledToRef.current === targetCommentId) return;
    if (targetIndex >= 0) {
      listRef.current?.scrollToIndex({ index: targetIndex, animated: true, viewPosition: 0.2 });
      setHighlightedId(targetCommentId);
      scrolledToRef.current = targetCommentId;
      if (highlightTimeout.current) {
        clearTimeout(highlightTimeout.current);
      }
      highlightTimeout.current = setTimeout(() => setHighlightedId(null), 2000);
      return;
    }

    if (
      !isPendingScroll &&
      commentsQuery.hasNextPage &&
      scrollAttempts < 5 &&
      !commentsQuery.isFetchingNextPage
    ) {
      commentsQuery.fetchNextPage();
      setScrollAttempts((prev) => prev + 1);
    }
  }, [
    commentsQuery.hasNextPage,
    commentsQuery.isFetchingNextPage,
    commentsQuery.fetchNextPage,
    isPendingScroll,
    scrollAttempts,
    targetCommentId,
    targetIndex,
  ]);

  useEffect(() => {
    return () => {
      if (highlightTimeout.current) {
        clearTimeout(highlightTimeout.current);
      }
    };
  }, []);

  const isSendDisabled =
    !canPost || !comment.trim() || createCommentMutation.isPending || updateCommentMutation.isPending;

  const updateCommentLikeState = (
    commentId: number,
    updater: (comment: MemoryComment) => MemoryComment
  ) => {
    queryClient.setQueryData(['memory-comments', memoryId], (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: { data?: MemoryComment[] }) => {
          if (!page?.data) return page;
          return {
            ...page,
            data: page.data.map((comment) =>
              Number(comment.id) === commentId ? updater(comment) : comment
            ),
          };
        }),
      };
    });
  };

  const handleToggleCommentLike = (commentId: number, currentlyLiked: boolean) => {
    const delta = currentlyLiked ? -1 : 1;
    updateCommentLikeState(commentId, (comment) => ({
      ...comment,
      is_liked: !currentlyLiked,
      likes_count: Math.max(0, (comment.likes_count ?? 0) + delta),
    }));

    const rollback = () => {
      updateCommentLikeState(commentId, (comment) => ({
        ...comment,
        is_liked: currentlyLiked,
        likes_count: Math.max(0, (comment.likes_count ?? 0) - delta),
      }));
    };

    if (currentlyLiked) {
      unlikeCommentMutation.mutate(commentId, { onError: rollback });
    } else {
      likeCommentMutation.mutate(commentId, { onError: rollback });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listRef}
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
          onScrollToIndexFailed={({ index }) => {
            listRef.current?.scrollToOffset({
              offset: Math.max(0, index - 1) * 120,
              animated: true,
            });
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.2 });
            }, 250);
          }}
          ListHeaderComponent={
            <View style={{ marginBottom: theme.spacing.lg }}>
              <AppText variant="title">Comments</AppText>
              <AppText tone="secondary">Comments on this moment.</AppText>
              <View style={{ marginTop: theme.spacing.lg }}>
                {memoryQuery.isLoading ? (
                  <ActivityIndicator />
                ) : isLocked ? (
                  <View>
                    <AppText variant="subtitle">Comments are private</AppText>
                    <AppText tone="secondary">Follow or add as friend to view comments.</AppText>
                  </View>
                ) : post ? (
                  <PostItem
                    post={post}
                    onPressUser={() => handleOpenProfile(post.user)}
                    onShowResharers={() =>
                      navigation.navigate('Resharers' as never, { memoryId } as never)
                    }
                    onPressTaggedUser={(user) => handleOpenProfile(user)}
                    onShowTaggedUsers={(users) => handleShowTaggedUsers(users)}
                    onPressMedia={(media, index) => handleOpenMedia(post, media, index)}
                    onLike={handleToggleLike}
                    onComment={handleFocusComposer}
                    onSave={() => {
                      if (saveMutation.isPending || unsaveMutation.isPending) return;
                      if (saved) {
                        setSaved(false);
                        setSaveCount((prev) => Math.max(0, (prev ?? post?.saves ?? 0) - 1));
                        unsaveMutation.mutate();
                        return;
                      }
                      setSaved(true);
                      setSaveCount((prev) => (prev ?? post?.saves ?? 0) + 1);
                      saveMutation.mutate();
                    }}
                    onReshare={() => {
                      if (reshareMutation.isPending || unreshareMutation.isPending) return;
                      if (reshared) {
                        setReshared(false);
                        setReshareCount((prev) => Math.max(0, (prev ?? post?.reshares ?? 0) - 1));
                        unreshareMutation.mutate();
                        return;
                      }
                      setReshared(true);
                      setReshareCount((prev) => (prev ?? post?.reshares ?? 0) + 1);
                      reshareMutation.mutate();
                    }}
                    onShare={() => handleShare(post)}
                    onShowLikes={handleShowPostLikes}
                  />
                ) : (
                  <AppText tone="secondary">Unable to load this moment.</AppText>
                )}
              </View>
              <AppText variant="subtitle" style={{ marginTop: theme.spacing.lg }}>
                Comments
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const isOwn = Boolean(currentUserId && Number(item.user.id) === currentUserId);
            const canModify = isOwn && !item.isLegacy && typeof item.commentId === 'number';
            const canReply = !item.isLegacy && typeof item.commentId === 'number';
            const indent = item.depth ? Math.min(item.depth, 2) * theme.spacing.lg : 0;
            const isHighlighted = highlightedId !== null && item.commentId === highlightedId;
            return (
              <View
                style={{
                  marginLeft: indent,
                  backgroundColor: isHighlighted ? theme.colors.accentSoft : 'transparent',
                  borderRadius: theme.radii.md,
                  padding: isHighlighted ? theme.spacing.sm : 0,
                }}
              >
                <CommentItem
                  user={item.user}
                  comment={item.text}
                  timeAgo={item.timeAgo}
                  likesCount={item.likesCount}
                  liked={item.isLiked}
                  onEdit={
                    canModify
                      ? () => {
                          setEditingCommentId(item.commentId);
                          setReplyTo(null);
                          setComment(item.text);
                        }
                      : undefined
                  }
                  onDelete={
                    canModify
                      ? () => {
                          deleteCommentMutation.mutate(item.commentId);
                        }
                      : undefined
                  }
                  onLike={
                    canReply
                      ? () => {
                          handleToggleCommentLike(item.commentId as number, item.isLiked);
                        }
                      : undefined
                  }
                  onShowLikes={
                    canReply
                      ? () => {
                          handleShowCommentLikes(item.commentId as number);
                        }
                      : undefined
                  }
                  onReply={
                    canReply
                      ? () => {
                          setReplyTo({ id: item.commentId, name: item.user.name });
                          setEditingCommentId(null);
                          setComment('');
                        }
                      : undefined
                  }
                />
              </View>
            );
          }}
          ListEmptyComponent={
            isLocked || commentsQuery.isLoading || adoptionsQuery.isLoading ? null : (
              <View>
                <AppText tone="secondary">No comments yet.</AppText>
              </View>
            )
          }
        />

        {editingCommentId || replyTo ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.xs,
            }}
          >
            <AppText variant="caption" tone="secondary">
              {editingCommentId ? 'Editing comment' : `Replying to ${replyTo?.name ?? 'comment'}`}
            </AppText>
            <Pressable
              onPress={() => {
                setEditingCommentId(null);
                setReplyTo(null);
                setComment('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel edit"
            >
              <AppText variant="caption" tone="secondary">
                Cancel
              </AppText>
            </Pressable>
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
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.pill,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.borderSubtle,
              gap: theme.spacing.sm,
            }}
          >
            <Feather name="message-circle" size={18} color={theme.colors.textSecondary} />
            <TextInput
              ref={composerRef}
              value={comment}
              onChangeText={setComment}
              placeholder="Write a comment..."
              placeholderTextColor={theme.colors.textSecondary}
              editable={canPost}
              autoFocus={focusComposer}
              style={{
                flex: 1,
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.fontFamily,
                fontSize: theme.typography.body.fontSize,
              }}
            />
          </View>
          <Pressable
            onPress={() => {
              if (isSendDisabled) return;
              if (editingCommentId) {
                updateCommentMutation.mutate({ id: editingCommentId, body: comment });
                return;
              }
              createCommentMutation.mutate({ body: comment, parent_id: replyTo?.id ?? null });
            }}
            disabled={isSendDisabled}
            accessibilityRole="button"
            accessibilityLabel="Post comment"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: canPost ? theme.colors.accent : theme.colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {createCommentMutation.isPending ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Feather name="send" size={18} color={theme.colors.surface} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
