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
import type { LogContext } from '../lib/types';

interface LogModalProps {
  visible: boolean;
  type: 'win' | 'sin';
  onSave: (entry: { type: 'win' | 'sin'; category: string; note: string; context: LogContext | undefined }) => Promise<void>;
  onClose: () => void;
  customCategories: string[];
  onAddCategory: (category: string) => Promise<void>;
}

export const LogModal = ({
  visible,
  type,
  onSave,
  onClose,
  customCategories,
  onAddCategory
}: LogModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedContext, setSelectedContext] = useState<LogContext | undefined>();
  const [addingCategory, setAddingCategory] = useState<boolean>(false);
  const [newCategoryInput, setNewCategoryInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const resetState = () => {
    setSelectedCategory('');
    setNote('');
    setSelectedContext(undefined);
    setAddingCategory(false);
    setNewCategoryInput('');
  };

  // Reset all state when the modal is dismissed so stale values don't
  // appear the next time it opens.
  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible]);

  // Reset category/context when switching between win and sin.
  useEffect(() => {
    resetState();
  }, [type]);

  const isWin = type === 'win';
  const activeColor = isWin ? Colors.primary : Colors.amber;
  const lightColor = isWin ? Colors.primaryLight : Colors.amberLight;

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleSave = async () => {
    if (!selectedCategory) return;
    setLoading(true);
    try {
      await onSave({
        type,
        category: selectedCategory,
        note: note.trim(),
        context: selectedContext,
      });
      // Reset state
      setSelectedCategory('');
      setNote('');
      setSelectedContext(undefined);
      setAddingCategory(false);
      setNewCategoryInput('');
    } catch (err: unknown) {
      console.error('Failed to save log', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategorySubmit = async () => {
    const trimmed = newCategoryInput.trim().toLowerCase();
    setLoading(true);
    try {
      if (trimmed && !allCategories.includes(trimmed)) {
        await onAddCategory(trimmed);
        setSelectedCategory(trimmed);
      } else if (trimmed) {
        setSelectedCategory(trimmed);
      }
      setAddingCategory(false);
      setNewCategoryInput('');
    } catch (err: unknown) {
      console.error('Failed to add category', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: activeColor }]}>
              {isWin ? 'I did it myself' : 'I used AI'}
            </Text>
            <Text style={styles.subtitle}>
              {isWin
                ? 'A rep for your brain. What did you work on?'
                : 'No judgment — awareness is the whole point.'}
            </Text>
          </View>

          <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CATEGORY</Text>
              <View style={styles.categoryWrap}>
                {allCategories.map((cat) => (
                  <PillButton
                    key={cat}
                    label={cat}
                    selected={selectedCategory === cat}
                    onPress={() => setSelectedCategory(cat)}
                    variant={isWin ? 'primary' : 'amber'}
                  />
                ))}
                {addingCategory ? (
                  <View style={styles.newCategoryInline}>
                    <TextInput
                      style={[styles.newCategoryInput, { borderColor: activeColor }]}
                      value={newCategoryInput}
                      onChangeText={setNewCategoryInput}
                      placeholder="name..."
                      autoFocus
                      onSubmitEditing={handleAddCategorySubmit}
                      returnKeyType="done"
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={[styles.newCategoryAddBtn, { backgroundColor: activeColor, opacity: loading ? 0.5 : 1 }]}
                      onPress={handleAddCategorySubmit}
                      disabled={loading}
                    >
                      <Text style={styles.newCategoryAddText}>add</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.newCategoryPill}
                    onPress={() => setAddingCategory(true)}
                  >
                    <Text style={styles.newCategoryText}>+ new</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>CONTEXT</Text>
              <View style={styles.contextRow}>
                <TouchableOpacity
                  style={[
                    styles.contextBtn,
                    selectedContext === 'work' && {
                      borderColor: activeColor,
                      backgroundColor: lightColor,
                    },
                  ]}
                  onPress={() => setSelectedContext(selectedContext === 'work' ? undefined : 'work')}
                >
                  <Text
                    style={[
                      styles.contextBtnText,
                      selectedContext === 'work' && { color: activeColor, fontFamily: Fonts.sansMedium },
                    ]}
                  >
                    work
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.contextBtn,
                    selectedContext === 'personal' && {
                      borderColor: activeColor,
                      backgroundColor: lightColor,
                    },
                  ]}
                  onPress={() => setSelectedContext(selectedContext === 'personal' ? undefined : 'personal')}
                >
                  <Text
                    style={[
                      styles.contextBtnText,
                      selectedContext === 'personal' && { color: activeColor, fontFamily: Fonts.sansMedium },
                    ]}
                  >
                    personal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="Quick note… (optional)"
              placeholderTextColor={Colors.textHint}
              value={note}
              onChangeText={setNote}
              multiline
            />

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: selectedCategory ? activeColor : Colors.streakEmpty, opacity: loading ? 0.5 : 1 },
                ]}
                onPress={handleSave}
                disabled={!selectedCategory || loading}
              >
                <Text style={styles.saveText}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.inputBorder,
    alignSelf: 'center',
    marginBottom: 22,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
    color: Colors.textMuted,
    lineHeight: 19.5, // 1.5 * 13
  },
  scrollContent: {},
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    letterSpacing: 0.08,
    marginBottom: 9,
    textTransform: 'uppercase',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  newCategoryPill: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.streakEmpty,
    justifyContent: 'center',
  },
  newCategoryText: {
    color: Colors.textHint,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
  },
  newCategoryInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newCategoryInput: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    width: 110,
    paddingVertical: 5,
    paddingHorizontal: 12,
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
  },
  newCategoryAddBtn: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: Radius.pill,
  },
  newCategoryAddText: {
    color: Colors.white,
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.base,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contextBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.streakEmpty,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  contextBtnText: {
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
  },
  noteInput: {
    borderWidth: 1.5,
    borderColor: Colors.streakEmpty,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
    color: Colors.textPrimary,
    marginBottom: 18,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.streakEmpty,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.textMuted,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
  },
  saveBtn: {
    flex: 2.5,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: Colors.white,
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
  },
});
