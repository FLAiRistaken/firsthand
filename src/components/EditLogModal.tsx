import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Colors, Fonts, FontSizes, Radius, DEFAULT_CATEGORIES } from '../constants/theme';
import { PillButton } from './PillButton';
import { BrainIcon } from './icons/BrainIcon';
import { ChipIcon } from './icons/ChipIcon';
import { Card } from './Card';
import type { LogEntry, LogContext } from '../lib/types';

interface EditLogModalProps {
  visible: boolean;
  log: LogEntry | null;
  onSave: (id: string, updates: { note: string; category: string; context?: LogContext }) => Promise<void>;
  onClose: () => void;
  customCategories: string[];
}

export const EditLogModal = ({
  visible,
  log,
  onSave,
  onClose,
  customCategories,
}: EditLogModalProps) => {
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [context, setContext] = useState<LogContext | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && log) {
      setNote(log.note ?? '');
      setCategory(log.category ?? '');
      setContext(log.context);
    }
  }, [visible, log]);

  if (!log) return null;

  const isWin = log.type === 'win';
  const activeColor = isWin ? Colors.primary : Colors.amber;
  const lightColor = isWin ? Colors.primaryLight : Colors.amberLight;

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await onSave(log.id, { note, category, context });
      onClose();
    } catch (error: unknown) {
      console.error('Failed to save log:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(log.timestamp).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });
  const formattedTime = new Date(log.timestamp).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { borderColor: lightColor }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Edit log</Text>
            <Text style={styles.subtitle}>Type and time can't be changed.</Text>

            <Card style={styles.readOnlyCard}>
              <View style={styles.readOnlyTop}>
                <View style={[styles.iconCircle, { backgroundColor: isWin ? Colors.primary : Colors.sinIconBg }]}>
                  {isWin ? <BrainIcon size={16} color="white" /> : <ChipIcon size={16} color={Colors.sinIconColor} />}
                </View>
                <Text style={[styles.readOnlyLabel, { color: isWin ? Colors.primary : Colors.sinLabelText }]}>
                  {isWin ? 'Win' : 'AI use'}
                </Text>
              </View>
              <Text style={styles.readOnlyTime}>
                {formattedDate} at {formattedTime}
              </Text>
            </Card>

            <Text style={styles.sectionTitle}>What kind?</Text>
            <View style={styles.categoryWrap}>
              {allCategories.map((c) => (
                <PillButton
                  key={c}
                  label={c}
                  selected={category === c}
                  onPress={() => setCategory(c)}
                  variant={isWin ? 'primary' : 'amber'}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Context (optional)</Text>
            <View style={styles.contextRow}>
              <TouchableOpacity
                onPress={() => setContext(context === 'work' ? undefined : 'work')}
                style={[
                  styles.contextButton,
                  context === 'work' && { backgroundColor: lightColor, borderColor: activeColor },
                ]}
              >
                <Text
                  style={[
                    styles.contextText,
                    context === 'work' && { color: activeColor, fontFamily: Fonts.sansMedium },
                  ]}
                >
                  Work
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setContext(context === 'personal' ? undefined : 'personal')}
                style={[
                  styles.contextButton,
                  context === 'personal' && { backgroundColor: lightColor, borderColor: activeColor },
                ]}
              >
                <Text
                  style={[
                    styles.contextText,
                    context === 'personal' && { color: activeColor, fontFamily: Fonts.sansMedium },
                  ]}
                >
                  Personal
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { borderColor: Colors.inputBorder }]}
              value={note}
              onChangeText={setNote}
              placeholder="What happened?"
              placeholderTextColor={Colors.textHint}
              multiline
              maxLength={200}
            />

            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: activeColor, opacity: (isSaving || !category) ? 0.5 : 1 },
                ]}
                onPress={handleSave}
                disabled={isSaving || !category}
              >
                <Text style={styles.saveText}>{isSaving ? 'Saving...' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: Colors.overlay,
  },
  sheet: {
    backgroundColor: Colors.appBg,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    borderTopWidth: 4,
    maxHeight: '90%',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48, // Extra padding for bottom
  },
  title: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 22,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 19.5,
    marginBottom: 20,
  },
  readOnlyCard: {
    padding: 12,
    marginBottom: 24,
  },
  readOnlyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readOnlyLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
  },
  readOnlyTime: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    marginTop: 4,
    marginLeft: 32, // align with text, account for 24px icon + 8px gap
  },
  sectionTitle: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contextButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.cardBg,
  },
  contextText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 16,
    paddingTop: 16, // needed for multiline iOS
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 32,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    backgroundColor: Colors.border,
  },
  cancelText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
  },
  saveText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.lg,
    color: Colors.white,
  },
});
