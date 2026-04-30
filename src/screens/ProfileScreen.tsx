import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, FontSizes, Spacing, Radius, BorderWidths, Sizes, DEFAULT_CATEGORIES } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { PersonIcon } from '../components/icons/PersonIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { TargetIcon } from '../components/icons/TargetIcon';
import { ChipIcon } from '../components/icons/ChipIcon';
import { BrainIcon } from '../components/icons/BrainIcon';
import { GearIcon } from '../components/icons/GearIcon';

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const scrollViewRef = useRef<ScrollView>(null);

  const [nameDraft, setNameDraft] = useState('');
  const [occupationDraft, setOccupationDraft] = useState('');
  const [goalDraft, setGoalDraft] = useState('');

  useEffect(() => {
    if (profile) {
      setNameDraft(profile.name || '');
      setOccupationDraft(profile.occupation || '');
      setGoalDraft(profile.goal || '');
    }
  }, [profile]);

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleAddCategory = async (): Promise<void> => {
    const normalised = newCategoryInput.trim().toLowerCase();
    if (!normalised) return;
    if (normalised.length > 30) {
      Alert.alert('Too long', 'Category name must be 30 characters or less.');
      return;
    }
    const existing = [
      ...DEFAULT_CATEGORIES,
      ...(profile?.custom_categories ?? [])
    ];
    if (existing.includes(normalised)) {
      Alert.alert('Already exists', 'That category already exists.');
      return;
    }
    await updateProfile({
      custom_categories: [...(profile?.custom_categories ?? []), normalised]
    });
    setNewCategoryInput('');
  };

  const hasNameOrOccChanges = nameDraft.trim() !== (profile?.name || '') || occupationDraft.trim() !== (profile?.occupation || '');
  const hasGoalChanges = goalDraft.trim() !== (profile?.goal || '');

  const scrollToInput = (yOffset: number) => {
    scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, Spacing.xxxl) },
        ]}
        keyboardShouldPersistTaps="handled"
      >

      {/* Header section */}
      <View style={styles.headerSection}>
        <View style={styles.avatarCircle}>
          <PersonIcon size={38} color={Colors.primary} />
        </View>

        <View style={styles.nameDisplay}>
          <TextInput
            style={styles.nameInput}
            value={nameDraft}
            onChangeText={setNameDraft}
            placeholder="Your Name"
            placeholderTextColor={Colors.textHint}
            onFocus={() => scrollToInput(0)}
          />
        </View>

        <View style={styles.occupationDisplay}>
          <TextInput
            style={styles.occupationInput}
            value={occupationDraft}
            onChangeText={setOccupationDraft}
            placeholder="Your Occupation"
            placeholderTextColor={Colors.textHint}
            onFocus={() => scrollToInput(50)}
          />
        </View>

        {hasNameOrOccChanges && (
          <View style={styles.saveHeaderButtonContainer}>
            <PillButton
              variant="primary"
              selected={true}
              label="Save profile"
              onPress={() => updateProfile({ name: nameDraft.trim(), occupation: occupationDraft.trim() })}
            />
          </View>
        )}
      </View>

      {/* Your Goals */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <TargetIcon />
          <Text style={styles.sectionLabel}>YOUR GOALS</Text>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionLabel}>What you want to do without AI</Text>
          <TextInput
            style={styles.goalInput}
            multiline
            numberOfLines={3}
            value={goalDraft}
            onChangeText={setGoalDraft}
            placeholder="Add Goal"
            placeholderTextColor={Colors.textHint}
            onFocus={() => scrollToInput(150)}
          />
          {hasGoalChanges && (
            <View style={styles.saveGoalButtonContainer}>
              <PillButton
                variant="primary"
                selected={true}
                label="Save goal"
                onPress={() => updateProfile({ goal: goalDraft.trim() })}
              />
            </View>
          )}
        </View>

        <View style={styles.divider} />

        <View style={styles.subsection}>
          <Text style={styles.subsectionLabel}>Success in a month</Text>
          <Text style={styles.goalText}>{profile?.success_definition || 'Not set'}</Text>
          <Text style={styles.captionText}>Set during onboarding — locked in</Text>
        </View>
      </Card>

      {/* AI Tools */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <ChipIcon size={12} color={Colors.primary} />
          <Text style={styles.sectionLabel}>AI TOOLS YOU USE</Text>
        </View>
        <View style={styles.toolsRow}>
          {profile?.ai_tools_used?.map((tool: string) => (
            <PillButton
              key={tool}
              variant="primary"
              selected={true}
              label={tool}
              onPress={() => {}}
            />
          ))}
          {(!profile?.ai_tools_used || profile.ai_tools_used.length === 0) && (
            <Text style={styles.captionText}>No tools selected</Text>
          )}
        </View>
        <Text style={styles.captionText}>Captured during onboarding</Text>
      </Card>


      {/* Custom Categories */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <BrainIcon size={12} color={Colors.primary} />
          <Text style={styles.sectionLabel}>YOUR CATEGORIES</Text>
        </View>
        <Text style={styles.categoriesDesc}>Defaults plus any you've added.</Text>

        <View style={styles.defaultCategoriesRow}>
          {DEFAULT_CATEGORIES.map((cat) => (
            <PillButton
              key={cat}
              variant="primary"
              selected={true}
              label={cat}
              onPress={() => {}}
            />
          ))}
        </View>

        <View style={styles.customCategoriesRow}>
          {profile?.custom_categories?.map((cat: string) => (
            <PillButton
              key={cat}
              variant="primary"
              selected={true}
              label={cat}
              onPress={() => {}}
              onLongPress={() => {
                Alert.alert(
                  `Archive "${cat}"?`,
                  "Existing logs keep this category but it won't be selectable for new logs.",
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Archive',
                      style: 'destructive',
                      onPress: () => {
                        updateProfile({
                          custom_categories: (profile?.custom_categories ?? []).filter((c: string) => c !== cat)
                        });
                      }
                    }
                  ]
                );
              }}
            />
          ))}
        </View>

        {showAddCategory ? (
          <View style={styles.addCategoryRow}>
            <TextInput
              style={styles.addCategoryInput}
              value={newCategoryInput}
              onChangeText={setNewCategoryInput}
              placeholder="Category name"
              placeholderTextColor={Colors.textHint}
              autoFocus
              autoCapitalize="none"
              onSubmitEditing={handleAddCategory}
              maxLength={30}
              onFocus={() => scrollToInput(400)}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setShowAddCategory(false);
              setNewCategoryInput('');
            }}>
              <CloseIcon size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.newCategoryButton}
            onPress={() => setShowAddCategory(true)}
          >
            <Text style={styles.newCategoryButtonText}>+ new category</Text>
          </TouchableOpacity>
        )}
      </Card>


      {/* Behaviour */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <GearIcon size={12} color={Colors.primary} />
          <Text style={styles.sectionLabel}>BEHAVIOUR</Text>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.settingLabel}>Default log context</Text>
          <Text style={styles.settingSubtitle}>Pre-selects work or personal on every new log.</Text>

          <View style={styles.contextToggleRow}>
            {['None', 'Work', 'Personal'].map((option) => {
              const val = option === 'None' ? null : option.toLowerCase();
              const isSelected = (profile?.default_context ?? null) === val;

              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.contextOptionBtn, isSelected && styles.contextOptionBtnSelected]}
                  onPress={() => updateProfile({ default_context: val as 'work' | 'personal' | null })}
                >
                  <Text style={[styles.contextOptionText, isSelected && styles.contextOptionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Account */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <PersonIcon size={12} color={Colors.primary} />
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
        </View>

        <TouchableOpacity
          style={[styles.accountRow, styles.accountRowBorder]}
          onPress={() => {
            Alert.alert(
              "Coming soon",
              "Data export will be available in an upcoming update.",
              [{ text: 'OK' }]
            );
          }}
        >
          <View>
            <Text style={styles.accountRowText}>Export my data</Text>
            <Text style={styles.accountRowSub}>Download all your logs as a CSV.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.accountRow, styles.accountRowBorder]}
          onPress={() => {
            Alert.alert(
              "Delete account?",
              "This is permanent. All your logs and profile data will be deleted and cannot be recovered.",
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete account', style: 'destructive', onPress: () => {
                  Alert.alert("Coming soon", "Account deletion will be available in an upcoming update.", [{ text: 'OK' }])
                }}
              ]
            );
          }}
        >
          <View>
            <Text style={styles.accountRowDestructiveText}>Delete account</Text>
            <Text style={styles.accountRowSub}>Permanently deletes your account and all logs.</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.accountRow}
          onPress={() => {
            Alert.alert(
              'Sign out?',
              'You can sign back in any time.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => signOut() }
              ]
            );
          }}
        >
          <Text style={styles.accountRowText}>Sign out</Text>
        </TouchableOpacity>

      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Firsthand v0.1.0</Text>
        <Text style={styles.footerSubText}>dev</Text>
      </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  content: {
    paddingHorizontal: Spacing.screen,
  },
  headerSection: {
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 3,
  },
  nameDisplay: {
    alignItems: 'center',
  },
  nameInput: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.serifSemiBold,
    textAlign: 'center',
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  saveHeaderButtonContainer: {
    marginTop: 12,
    alignSelf: 'center',
  },
  saveGoalButtonContainer: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  nameText: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  occupationDisplay: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  occupationInput: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 4,
  },
  occupationText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryLight,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.xs,
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  subsection: {},
  subsectionLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    marginBottom: Spacing.xs,
  },
  goalInput: {
    backgroundColor: Colors.appBg,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  goalText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  divider: {
    height: BorderWidths.sm,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  captionText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
    marginTop: Spacing.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoriesDesc: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },
  defaultCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  customCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  addCategoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  addCategoryInput: {
    flex: 1,
    backgroundColor: Colors.appBg,
    borderWidth: BorderWidths.sm,
    borderColor: Colors.inputBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.base,
  },
  addButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  addButtonText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.white,
  },
  closeButton: {
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newCategoryButton: {
    borderWidth: BorderWidths.sm,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  newCategoryButtonText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },

  settingLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  contextToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  contextOptionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contextOptionBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  contextOptionText: {
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
  },
  contextOptionTextSelected: {
    fontFamily: Fonts.sansMedium,
    color: Colors.white,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  accountRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  accountRowText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  accountRowDestructiveText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: "#C0392B",
  },
  accountRowSub: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textHint,
  },

  footer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  footerText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
  },
  footerSubText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
    marginTop: Spacing.xs,
  },
});
