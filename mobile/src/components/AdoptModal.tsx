import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/useTheme';
import { AppText } from './AppText';
import { Button } from './Button';
import { Input } from './Input';
import { SegmentedControl } from './SegmentedControl';

type AdoptModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: { note?: string; visibility: 'private' | 'shared' }) => void;
};

export const AdoptModal = ({ visible, onClose, onSubmit }: AdoptModalProps) => {
  const theme = useTheme();
  const [note, setNote] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private');

  const handleSubmit = () => {
    onSubmit({ note: note.trim() || undefined, visibility });
    setNote('');
    setVisibility('private');
  };

  return (
    <Modal animationType="slide" visible={visible} transparent>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AppText variant="title">Save this memory</AppText>
          <Input
            value={note}
            onChangeText={setNote}
            placeholder="Add a note (optional)"
            multiline
            style={styles.input}
            containerStyle={{ marginTop: theme.spacing.sm }}
          />
          <SegmentedControl
            options={[
              { label: 'Private', value: 'private' },
              { label: 'Shared', value: 'shared' },
            ]}
            value={visibility}
            onChange={(value) => setVisibility(value as typeof visibility)}
            style={{ marginTop: theme.spacing.md }}
          />
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
            <Button label="Save" onPress={handleSubmit} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  card: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 12,
  },
  input: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
