import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import BottomSheet from './BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../theme';

const QUICK = ['Less spicy', 'Extra spicy', 'No onion', 'No garlic', 'Jain', 'Less oil', 'Parcel'];

type Props = { itemName: string; note: string; onSave: (note: string) => void; onClose: () => void };

// Kitchen note for one item, e.g. "less spicy, no onion". Printed on the kitchen slip.
export default function NoteSheet({ itemName, note, onSave, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(note);

  function toggle(q: string) {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
    const has = parts.some((p) => p.toLowerCase() === q.toLowerCase());
    setText((has ? parts.filter((p) => p.toLowerCase() !== q.toLowerCase()) : [...parts, q]).join(', '));
  }

  return (
    <BottomSheet onClose={onClose}>
          <Text style={styles.title}>Note for kitchen</Text>
          <Text style={styles.sub}>{itemName}</Text>
          <View style={styles.chips}>
            {QUICK.map((q) => {
              const on = text.toLowerCase().split(',').map((p) => p.trim()).includes(q.toLowerCase());
              return (
                <Pressable
                  key={q}
                  onPress={() => toggle(q)}
                  style={[styles.chip, on && styles.chipOn]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{q}</Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Or type a note"
            placeholderTextColor={colors.muted}
            style={styles.input}
            maxLength={80}
          />
          <Pressable style={styles.primary} onPress={() => onSave(text.trim())} accessibilityRole="button">
            <Text style={styles.primaryText}>Save note</Text>
          </Pressable>
          {!!note && (
            <Pressable style={styles.textBtn} onPress={() => onSave('')} accessibilityRole="button">
              <Text style={[styles.textBtnText, { color: colors.danger }]}>Remove note</Text>
            </Pressable>
          )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,42,31,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: colors.line },
  chipOn: { borderColor: colors.brand, backgroundColor: '#E6F4EA' },
  chipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  chipTextOn: { color: colors.brand },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, marginTop: 14 },
  primary: { height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: colors.paper },
  textBtn: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  textBtnText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.brand },
});
