import React, { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, View } from 'react-native';

import { AppText } from '../components/AppText';
import { BackButton } from '../components/BackButton';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { DataExportResponse, requestDataExport } from '../api/preferencesApi';
import { clearRecentSearches } from '../storage/recentSearches';
import { useTheme } from '../theme/useTheme';

type StorageItem = {
  id: string;
  label: string;
  size: string;
};

const mockStorage: StorageItem[] = [
  { id: 'posts', label: 'Cached posts', size: '182 MB' },
  { id: 'media', label: 'Media previews', size: '96 MB' },
  { id: 'search', label: 'Recent searches', size: '2 MB' },
  { id: 'other', label: 'Other cache', size: '18 MB' },
];

export const DataControlsScreen = () => {
  const theme = useTheme();
  const [exportStatus, setExportStatus] = useState<DataExportResponse | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleDownload = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const response = await requestDataExport();
      setExportStatus(response);
      const message =
        response.status === 'ready'
          ? 'Your export is ready to download.'
          : 'We will notify you when your data export is ready.';
      Alert.alert('Request submitted', message);
    } catch (error) {
      Alert.alert('Request failed', 'We could not start a data export.');
    } finally {
      setExporting(false);
    }
  };

  const handleClearCache = async () => {
    await clearRecentSearches();
    Alert.alert('Cache cleared', 'Temporary files and recent searches were cleared.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <BackButton />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, paddingTop: theme.spacing.xxl + 8 }}>
        <AppText variant="title">Data controls</AppText>
        <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
          Manage storage usage and exports.
        </AppText>

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="subtitle">Storage usage</AppText>
          <View style={{ marginTop: theme.spacing.sm }}>
            {mockStorage.map((item) => (
              <Card key={item.id} style={{ marginBottom: theme.spacing.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <AppText variant="subtitle">{item.label}</AppText>
                  <AppText tone="secondary">{item.size}</AppText>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {exportStatus ? (
          <View style={{ marginTop: theme.spacing.lg }}>
            <AppText variant="subtitle">Data export</AppText>
            <Card style={{ marginTop: theme.spacing.sm }}>
              <AppText variant="subtitle">Status</AppText>
              <AppText tone="secondary" style={{ marginTop: theme.spacing.xs }}>
                {exportStatus.status === 'ready'
                  ? 'Ready to download.'
                  : exportStatus.status === 'processing'
                  ? 'Processing your request.'
                  : 'Queued for processing.'}
              </AppText>
            </Card>
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
          <Button
            label={exporting ? 'Requesting...' : 'Download my data'}
            variant="secondary"
            onPress={handleDownload}
            disabled={exporting}
          />
          <Button label="Clear cache" variant="secondary" onPress={handleClearCache} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
