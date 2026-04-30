import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, Radius, BorderWidths, DEFAULT_CATEGORIES } from '../constants/theme';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { PersonIcon } from '../components/icons/PersonIcon';

export default function ProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const [editingOccupation, setEditingOccupation] = useState(false);
  const [occupationDraft, setOccupationDraft] = useState('');

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState('');

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleAddCategory = async () => {
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
    setShowAddCategory(false);
  };

  // Layout placeholder
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header section */}
      <View style={styles.headerSection}>
        <View style={styles.avatarCircle}>
          <PersonIcon size={36} color={Colors.primary} />
        </View>

        <View style={styles.nameDisplay}>
          {editingName ? (
            <TextInput
              style={styles.nameInput}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              onSubmitEditing={() => {
                updateProfile({ name: nameDraft.trim() });
                setEditingName(false);
              }}
              onBlur={() => {
                updateProfile({ name: nameDraft.trim() });
                setEditingName(false);
              }}
            />
          ) : (
            <TouchableOpacity onPress={() => {
              setEditingName(true);
              setNameDraft(profile?.name ?? '');
            }}>
              <Text style={styles.nameText}>{profile?.name || 'Add Name'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.occupationDisplay}>
          {editingOccupation ? (
            <TextInput
              style={styles.occupationInput}
              value={occupationDraft}
              onChangeText={setOccupationDraft}
              autoFocus
              onSubmitEditing={() => {
                updateProfile({ occupation: occupationDraft.trim() });
                setEditingOccupation(false);
              }}
              onBlur={() => {
                updateProfile({ occupation: occupationDraft.trim() });
                setEditingOccupation(false);
              }}
            />
          ) : (
            <TouchableOpacity onPress={() => {
              setEditingOccupation(true);
              setOccupationDraft(profile?.occupation ?? '');
            }}>
              <Text style={styles.occupationText}>{profile?.occupation || 'Add Occupation'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Your Goals */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>YOUR GOALS</Text>

        <View style={styles.subsection}>
          <Text style={styles.subsectionLabel}>What you want to do without AI</Text>
          {editingGoal ? (
            <TextInput
              style={styles.goalInput}
              multiline
              numberOfLines={3}
              value={goalDraft}
              onChangeText={setGoalDraft}
              autoFocus
              onBlur={() => {
                updateProfile({ goal: goalDraft.trim() });
                setEditingGoal(false);
              }}
            />
          ) : (
            <TouchableOpacity onPress={() => {
              setEditingGoal(true);
              setGoalDraft(profile?.goal ?? '');
            }}>
              <Text style={styles.goalText}>{profile?.goal || 'Add Goal'}</Text>
            </TouchableOpacity>
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
        <Text style={styles.sectionLabel}>AI TOOLS YOU USE</Text>
        <View style={styles.toolsRow}>
          {profile?.ai_tools_used?.map((tool: string) => (
            <PillButton
              /* @ts-ignore */
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
        <Text style={styles.sectionLabel}>YOUR CATEGORIES</Text>
        <Text style={styles.categoriesDesc}>Defaults plus any you've added.</Text>

        <View style={styles.defaultCategoriesRow}>
          {DEFAULT_CATEGORIES.map((cat) => (
            <PillButton
              /* @ts-ignore */
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
              /* @ts-ignore */
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
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => {
              setShowAddCategory(false);
              setNewCategoryInput('');
            }}>
              <Text style={styles.closeButtonText}>✕</Text>
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

      {/* Account */}
      <Card style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <TouchableOpacity
          style={styles.signOutButton}
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
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </Card>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Firsthand v0.1.0</Text>
        <Text style={styles.footerSubText}>dev</Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
  },
  content: {
    paddingHorizontal: Spacing.screen,
    paddingBottom: 40,
  },
  headerSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderRadius: Radius.full,
  },
  nameDisplay: {
    alignItems: 'center',
  },
  nameInput: {
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.serifSemiBold,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  nameText: {
    fontFamily: Fonts.serifSemiBold,
    fontSize: FontSizes.xxl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  occupationDisplay: {
    alignItems: 'center',
    marginTop: 4,
  },
  occupationInput: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  occupationText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    letterSpacing: 0.08,
    marginBottom: 12,
  },
  subsection: {},
  subsectionLabel: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textHint,
    marginBottom: 4,
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
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  captionText: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    color: Colors.textHint,
    marginTop: 6,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  categoriesDesc: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  defaultCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 8,
  },
  customCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
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
  },
  closeButtonText: {
    fontSize: FontSizes.base,
    color: Colors.textMuted,
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
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  signOutText: {
    fontFamily: Fonts.sansMedium,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
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
    marginTop: 2,
  },


});
