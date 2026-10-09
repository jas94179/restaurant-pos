import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { reloadMenu, useMenu } from '../data/menuStore';
import { setItemAvailable } from '../db/database';
import { colors, fonts } from '../theme';

// Stock on/off for managers and cashiers: switch dishes on and off, without touching names or prices.
export default function StockScreen({ onBack }: { onBack: () => void }) {
  const menu = useMenu();
  const [query, setQuery] = useState('');
  const [onlyOut, setOnlyOut] = useState(false);

  const visible = menu.items.filter((i) => !i.archived);
  const outCount = visible.filter((i) => !i.available).length;

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu.categories
      .map((c) => ({
        title: c.name,
        data: visible.filter(
          (i) => i.categoryId === c.id && (!q || i.name.toLowerCase().includes(q)) && (!onlyOut || !i.available),
        ),
      }))
      .filter((s) => s.data.length > 0);
  }, [menu, query, onlyOut]);

  function toggle(id: string, available: boolean) {
    setItemAvailable(id, available);
    reloadMenu();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button">
          <Text style={styles.backLink}>‹ Profile</Text>
        </Pressable>
        <Text style={styles.lead}>
          {outCount === 0 ? 'Everything is available.' : `${outCount} item${outCount === 1 ? ' is' : 's are'} out of stock.`}{' '}
          Switched-off items can't be added to bills.
        </Text>

        <View style={styles.filters}>
          <View style={styles.searchBox}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search items"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>
          <Pressable
            onPress={() => setOnlyOut((v) => !v)}
            style={[styles.filterBtn, onlyOut && styles.filterBtnActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: onlyOut }}
          >
            <Text style={[styles.filterText, onlyOut && styles.filterTextActive]}>Out of stock</Text>
          </Pressable>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(i) => i.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, !item.available && styles.nameOff]}>{item.name}</Text>
              <Text style={[styles.state, !item.available && styles.stateOff]}>
                {item.available ? 'Available' : 'Out of stock'}
              </Text>
            </View>
            <Switch
              value={item.available}
              onValueChange={(v) => toggle(item.id, v)}
              trackColor={{ true: colors.brand, false: colors.line }}
              accessibilityLabel={`${item.name} available`}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>{onlyOut ? 'Nothing is out of stock.' : 'No items match your search.'}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist },
  top: { paddingHorizontal: 16, paddingTop: 16 },
  backLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brand },
  lead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.muted, marginTop: 8 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  searchBox: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 12, justifyContent: 'center' },
  searchInput: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: 0 },
  filterBtn: { height: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.paper, justifyContent: 'center' },
  filterBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  filterTextActive: { color: colors.paper },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  section: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink, marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: colors.paper, borderRadius: 12, borderWidth: 1, borderColor: colors.line, marginBottom: 6 },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  nameOff: { color: colors.muted },
  state: { fontFamily: fonts.regular, fontSize: 13, color: colors.veg, marginTop: 2 },
  stateOff: { color: colors.danger },
  empty: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 32 },
});
