import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PinPad from '../components/PinPad';
import { addStaff, deactivateStaff, Role, setStaffPin, Staff, updateStaff } from '../db/database';
import {
  makePinHash,
  pinInUse,
  reloadStaff,
  ROLE_INFO,
  ROLE_LABEL,
  useCurrentUser,
  useStaffList,
} from '../data/staffStore';
import { colors, fonts } from '../theme';

const ROLES: Role[] = ['owner', 'manager', 'cashier'];

type Draft = {
  id: string | null; // null = new person
  name: string;
  role: Role;
  step: 'details' | 'pin' | 'confirm';
  pin: string;
  confirm: string;
};

// Owner only: add staff, set their role and PIN, reset PINs, remove people.
export default function StaffScreen({ onBack }: { onBack: () => void }) {
  const staff = useStaffList();
  const me = useCurrentUser();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ownerCount = staff.filter((s) => s.role === 'owner').length;

  function openNew() {
    setError(null);
    setDraft({ id: null, name: '', role: 'cashier', step: 'details', pin: '', confirm: '' });
  }

  function openEdit(s: Staff) {
    setError(null);
    setDraft({ id: s.id, name: s.name, role: s.role, step: 'details', pin: '', confirm: '' });
  }

  function saveDetails() {
    if (!draft) return;
    const name = draft.name.trim();
    if (name.length < 2) return setError('Enter a name.');
    if (staff.some((s) => s.id !== draft.id && s.name.toLowerCase() === name.toLowerCase())) {
      return setError('Someone with this name already exists. Add a surname or initial.');
    }
    const existing = staff.find((s) => s.id === draft.id);
    // Never leave the restaurant without an owner.
    if (existing?.role === 'owner' && draft.role !== 'owner' && ownerCount <= 1) {
      return setError('There must be at least one owner.');
    }
    setError(null);
    if (draft.id) {
      updateStaff(draft.id, { name, role: draft.role });
      reloadStaff();
      setDraft(null);
    } else {
      setDraft({ ...draft, name, step: 'pin' });
    }
  }

  async function finishPin(confirm: string) {
    if (!draft) return;
    if (confirm !== draft.pin) {
      setError("PINs don't match. Enter the new PIN again.");
      setDraft({ ...draft, step: 'pin', pin: '', confirm: '' });
      return;
    }
    setBusy(true);
    try {
      if (await pinInUse(draft.pin, draft.id ?? undefined)) {
        setError('Someone else already uses this PIN. Choose a different one.');
        setDraft({ ...draft, step: 'pin', pin: '', confirm: '' });
        return;
      }
      const { hash, salt } = await makePinHash(draft.pin);
      if (draft.id) setStaffPin(draft.id, hash, salt);
      else addStaff({ name: draft.name, role: draft.role, pinHash: hash, pinSalt: salt });
      reloadStaff();
      setDraft(null);
      setError(null);
    } finally {
      setBusy(false);
    }
  }

  function typePin(d: string) {
    if (!draft || busy) return;
    setError(null);
    if (draft.step === 'pin') {
      const pin = (draft.pin + d).slice(0, 4);
      setDraft({ ...draft, pin, step: pin.length === 4 ? 'confirm' : 'pin' });
    } else {
      const confirm = (draft.confirm + d).slice(0, 4);
      setDraft({ ...draft, confirm });
      if (confirm.length === 4) finishPin(confirm);
    }
  }

  function remove(s: Staff) {
    if (s.id === me?.id) return setError("You can't remove yourself.");
    if (s.role === 'owner' && ownerCount <= 1) return setError('There must be at least one owner.');
    Alert.alert(`Remove ${s.name}?`, 'They will no longer be able to log in. Their old bills stay as they are.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          deactivateStaff(s.id);
          reloadStaff();
          setDraft(null);
        },
      },
    ]);
  }

  const editing = draft?.id ? staff.find((s) => s.id === draft.id) : null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
          <Text style={styles.backLink}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.lead}>Everyone gets their own PIN, so every bill shows who made it.</Text>

        <View style={styles.card}>
          {staff.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => openEdit(s)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.mist }]}
              accessibilityRole="button"
            >
              <View style={[styles.avatar, s.role === 'owner' && styles.avatarOwner]}>
                <Text style={[styles.avatarText, s.role === 'owner' && styles.avatarTextOwner]}>
                  {s.name[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {s.name}
                  {s.id === me?.id ? ' (you)' : ''}
                </Text>
                <Text style={styles.role}>{ROLE_LABEL[s.role]}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.addBtn} onPress={openNew} accessibilityRole="button">
          <Text style={styles.addText}>Add staff member</Text>
        </Pressable>
      </ScrollView>

      {draft && (
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !busy && setDraft(null)} accessibilityLabel="Close" />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.handle} />
              <ScrollView keyboardShouldPersistTaps="handled">
                {draft.step === 'details' ? (
                  <>
                    <Text style={styles.sheetTitle}>{draft.id ? 'Edit staff member' : 'New staff member'}</Text>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                      value={draft.name}
                      onChangeText={(name) => setDraft({ ...draft, name })}
                      placeholder="e.g. Ravi"
                      placeholderTextColor={colors.muted}
                      style={styles.input}
                      autoCapitalize="words"
                      autoFocus={!draft.id}
                    />
                    <Text style={styles.label}>Role</Text>
                    <View style={{ gap: 8 }}>
                      {ROLES.map((r) => (
                        <Pressable
                          key={r}
                          onPress={() => setDraft({ ...draft, role: r })}
                          style={[styles.roleOpt, draft.role === r && styles.roleOptActive]}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: draft.role === r }}
                        >
                          <Text style={styles.roleTitle}>{ROLE_LABEL[r]}</Text>
                          <Text style={styles.roleInfo}>{ROLE_INFO[r]}</Text>
                        </Pressable>
                      ))}
                    </View>

                    {error && <Text style={styles.error}>{error}</Text>}

                    <Pressable style={styles.primary} onPress={saveDetails} accessibilityRole="button">
                      <Text style={styles.primaryText}>{draft.id ? 'Save changes' : 'Next: set PIN'}</Text>
                    </Pressable>

                    {editing && (
                      <View style={styles.secondaryRow}>
                        <Pressable
                          onPress={() => setDraft({ ...draft, step: 'pin', pin: '', confirm: '' })}
                          style={styles.secondary}
                          accessibilityRole="button"
                        >
                          <Text style={styles.secondaryText}>Reset PIN</Text>
                        </Pressable>
                        {editing.id !== me?.id && (
                          <Pressable onPress={() => remove(editing)} style={styles.secondary} accessibilityRole="button">
                            <Text style={[styles.secondaryText, { color: colors.danger }]}>Remove</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={styles.sheetTitle}>
                      {draft.step === 'pin' ? `New PIN for ${draft.name}` : 'Enter the PIN again'}
                    </Text>
                    <Text style={styles.lead}>
                      {draft.step === 'pin'
                        ? 'Ask them to type it themselves, so only they know it.'
                        : 'Just to make sure it is right.'}
                    </Text>
                    <View style={{ marginTop: 16 }}>
                      <PinPad
                        length={draft.step === 'pin' ? draft.pin.length : draft.confirm.length}
                        onDigit={typePin}
                        onDelete={() =>
                          setDraft(
                            draft.step === 'pin'
                              ? { ...draft, pin: draft.pin.slice(0, -1) }
                              : { ...draft, confirm: draft.confirm.slice(0, -1) },
                          )
                        }
                        error={!!error}
                      />
                    </View>
                    {error && <Text style={styles.error}>{error}</Text>}
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  content: { padding: 16, paddingBottom: 40 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand },
  lead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted, marginTop: 8, marginBottom: 12 },
  card: { backgroundColor: colors.paper, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5EEE9', alignItems: 'center', justifyContent: 'center' },
  avatarOwner: { backgroundColor: colors.brand },
  avatarText: { fontFamily: fonts.bold, fontSize: 17, color: colors.brand },
  avatarTextOwner: { color: colors.turmeric },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  role: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 2 },
  chevron: { fontFamily: fonts.regular, fontSize: 26, color: colors.muted },
  addBtn: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  addText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 10, marginBottom: 14 },
  sheetTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted, marginTop: 16, marginBottom: 6 },
  input: { height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 14, fontFamily: fonts.regular, fontSize: 17, color: colors.ink },
  roleOpt: { padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.line },
  roleOptActive: { borderColor: colors.brand, borderWidth: 2, backgroundColor: '#E5EEE9' },
  roleTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  roleInfo: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger, marginTop: 12 },
  primary: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  secondaryRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondary: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
});
