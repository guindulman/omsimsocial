import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Switch, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Card } from '../components/Card';
import { Divider } from '../components/Divider';
import { Icon } from '../components/Icon';
import { api } from '../api';
import { ApiError } from '../api/client';
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../theme/useTheme';

export const ProfileViewsScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const [shareProfileViews, setShareProfileViews] = useState(true);

  const summaryQuery = useQuery({
    queryKey: ['profile-views', 'summary'],
    queryFn: () => api.profileViewsSummary(),
    enabled: Boolean(token),
  });

  const viewsQuery = useQuery({
    queryKey: ['profile-views', 'list'],
    queryFn: () => api.profileViews({ limit: 20 }),
    enabled: Boolean(token),
  });

  useEffect(() => {
    const next = summaryQuery.data?.share_profile_views;
    if (typeof next === 'boolean') {
      setShareProfileViews(next);
    }
  }, [summaryQuery.data?.share_profile_views]);

  const updateShareMutation = useMutation({
    mutationFn: (nextValue: boolean) => api.updateProfileSettings({ share_profile_views: nextValue }),
    onSuccess: (response, nextValue) => {
      const updated = response.settings?.share_profile_views;
      setShareProfileViews(typeof updated === 'boolean' ? updated : nextValue);
      queryClient.invalidateQueries({ queryKey: ['profile-views', 'summary'] });
    },
    onError: (_error, nextValue) => {
      setShareProfileViews(!nextValue);
    },
  });

  const sources = useMemo(() => {
    const list = summaryQuery.data?.sources ?? [];
    return [...list].sort((a, b) => b.value - a.value);
  }, [summaryQuery.data?.sources]);
  const totalViews24h = summaryQuery.data?.total_24h ?? 0;
  const totalViews7d = summaryQuery.data?.total_7d ?? 0;
  const hasSources = sources.length > 0;
  const views = viewsQuery.data?.data ?? [];
  const viewsError = viewsQuery.error;
  const viewsAccessDenied = viewsError instanceof ApiError && viewsError.status === 403;
  const viewsUnavailable = viewsError instanceof ApiError && viewsError.status === 404;
  const sourceLabelMap: Record<string, string> = {
    connections: 'Friends posts',
    pulse: 'Public posts',
    legacy: 'Stories',
    fresh: 'For you feed',
    last_call: 'Expiring posts',
    gems: 'Highlights',
    search: 'Search',
    invite: 'Invite link',
    nearby: 'Nearby',
    profile_link: 'Profile link',
    unknown: 'Other',
  };
  const sourcesCaption =
    totalViews7d > 0
      ? `Share of ${totalViews7d} views in the last 7 days.`
      : 'No views yet in the last 7 days.';
  const openProfile = (viewerId?: number) => {
    if (!viewerId) return;
    navigation.navigate('UserProfile' as never, { userId: viewerId } as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl }}
      >
        <AppText variant="title">Profile Views</AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          <View style={{ flexDirection: 'row' }}>
            <Card style={{ flex: 1, marginRight: theme.spacing.md }}>
              <AppText variant="subtitle">{totalViews24h}</AppText>
              <AppText tone="secondary">Last 24h</AppText>
            </Card>
            <Card style={{ flex: 1 }}>
              <AppText variant="subtitle">{totalViews7d}</AppText>
              <AppText tone="secondary">Last 7d</AppText>
            </Card>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Card>
            <AppText variant="subtitle">Where views came from</AppText>
            <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
              {sourcesCaption}
            </AppText>
            <View style={{ marginTop: theme.spacing.md }}>
              {summaryQuery.isLoading ? (
                <View style={{ paddingVertical: theme.spacing.sm, alignItems: 'center' }}>
                  <ActivityIndicator />
                </View>
              ) : hasSources ? (
                sources.map((item) => {
                  const percent = Math.max(0, Math.min(100, item.value));
                  const key = item.label?.toLowerCase?.() ?? item.label;
                  const displayLabel = sourceLabelMap[key] ?? item.label;
                  return (
                    <View key={item.label} style={{ marginBottom: theme.spacing.md }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <AppText tone="secondary">{displayLabel}</AppText>
                        <AppText>{Math.round(percent)}%</AppText>
                      </View>
                      <View
                        style={{
                          marginTop: theme.spacing.xs,
                          height: 6,
                          borderRadius: 999,
                          backgroundColor: theme.colors.surfaceAlt,
                          overflow: 'hidden',
                        }}
                      >
                        <View
                          style={{
                            width: `${percent}%`,
                            height: '100%',
                            backgroundColor: theme.colors.accent,
                          }}
                        />
                      </View>
                    </View>
                  );
                })
              ) : (
                <AppText tone="secondary">No source data yet.</AppText>
              )}
            </View>
            <AppText variant="caption" tone="secondary">
              Percentages may not total 100% due to rounding.
            </AppText>
          </Card>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="views" />
              <View style={{ marginLeft: theme.spacing.sm }}>
                <AppText variant="subtitle">Share profile views</AppText>
              </View>
            </View>
            <Switch
              value={shareProfileViews}
              onValueChange={(value) => {
                setShareProfileViews(value);
                updateShareMutation.mutate(value);
              }}
              disabled={updateShareMutation.isPending || summaryQuery.isLoading || !token}
              trackColor={{ true: theme.colors.accentSoft, false: theme.colors.borderSubtle }}
              thumbColor={shareProfileViews ? theme.colors.accent : theme.colors.surfaceAlt}
            />
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <AppText tone="secondary">
              {shareProfileViews
                ? 'Viewers appear to friends after a short delay.'
                : 'Viewer names remain private until you enable sharing.'}
            </AppText>
          </View>
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <Divider />
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Recent viewers</AppText>
          <View style={{ marginTop: theme.spacing.md }}>
            {viewsQuery.isLoading ? (
              <View style={{ paddingVertical: theme.spacing.sm, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : viewsAccessDenied ? (
              <AppText tone="secondary">Viewer details are private.</AppText>
            ) : viewsUnavailable ? (
              <AppText tone="secondary">Viewer list is unavailable right now.</AppText>
            ) : views.length ? (
              views.map((viewer, index) => {
                const name = viewer.viewer?.name ?? 'Omsim Member';
                const viewerId = viewer.viewer?.id;
                const canOpenProfile = shareProfileViews && Boolean(viewerId);
                return (
                  <Card
                    key={viewer.id}
                    style={{ marginBottom: theme.spacing.md }}
                    onPress={canOpenProfile ? () => openProfile(viewerId) : undefined}
                  >
                    <AppText>
                      {shareProfileViews ? name : `Private viewer ${index + 1}`}
                    </AppText>
                    <AppText tone="secondary">Friends only - delayed reporting</AppText>
                  </Card>
                );
              })
            ) : (
              <AppText tone="secondary">No recent viewers yet.</AppText>
            )}
          </View>
          <AppText variant="caption" tone="secondary">
            Privacy note: viewer lists update with a short delay and only for friends.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
