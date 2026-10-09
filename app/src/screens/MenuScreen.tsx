import { ReactNode, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { reloadMenu, useMenu } from '../data/menuStore';
import {
  addCategory,
  addMenuItem,
  archiveMenuItem,
  DbMenuItem,
  deleteCategory,
  renameCategory,
  setItemAvailable,
  updateMenuItem,
} from '../db/database';
import { formatRupees } from '../utils/money';
import { colors, fonts } from '../theme';

type ItemDraft = { id: string | null; name: string; price: string; categoryId: string; veg: boolean };
type CategoryDraft = { id: string | null; name: string };

// "120" or "120.50" -> paise. Returns null when not a valid positive price.
function parsePrice(text: string): number | null {
  const clean = text.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  const paise = Math.round(parseFloat(clean) * 100);
  return paise > 0 ? paise : null;
}

function priceText(paise: number): string {
  return paise % 100 === 0 ? String(paise / 100) : (paise / 100).toFixed(2);
}

export default function MenuScreen() {
  const menu = useMenu();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<ItemDraft | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const category = menu.categories.find((c) => c.id === categoryId) ?? menu.categories[0] ?? null;
  const visible = menu.items.filter((i) => !i.archived);
  const items = category ? visible.filter((i) => i.categoryId === category.id) : [];

  // ----- items -----
  function newItem() {
    if (!category) {
      setCategoryDraft({ id: null, name: '' });
      return;
    }
    setFormError(null);
    setItemDraft({ id: null, name: '', price: '', categoryId: category.id, veg: true });
  }

  function editItem(item: DbMenuItem) {
    setFormError(null);
    setItemDraft({ id: item.id, name: item.name, price: priceText(item.price), categoryId: item.categoryId, veg: item.veg });
  }

  function saveItem() {
    if (!itemDraft) return;
    const name = itemDraft.name.trim();
    const price = parsePrice(itemDraft.price);
    if (!name) return setFormError('Enter the item name.');
    if (price == null) return setFormError('Enter a valid price, like 120 or 120.50');
    const duplicate = visible.some(
      (i) => i.id !== itemDraft.id && i.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return setFormError('An item with this name already exists.');

    const input = { name, price, categoryId: itemDraft.categoryId, veg: itemDraft.veg };
    if (itemDraft.id) updateMenuItem(itemDraft.id, input);
    else addMenuItem(input);
    reloadMenu();
    setCategoryId(itemDraft.categoryId);
    setItemDraft(null);
  }

  function removeItem() {
    if (!itemDraft?.id) return;
    const id = itemDraft.id;
    Alert.alert('Delete item?', `"${itemDraft.name}" will be removed from the menu. Old bills are not affected.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          archiveMenuItem(id);
          reloadMenu();
          setItemDraft(null);
        },
      },
    ]);
  }

  function toggleAvailable(item: DbMenuItem, value: boolean) {
    setItemAvailable(item.id, value);
    reloadMenu();
  }

  // ----- categories -----
  function saveCategory() {
    if (!categoryDraft) return;
    const name = categoryDraft.name.trim();
    if (!name) return setFormError('Enter a category name.');
    const duplicate = menu.categories.some(
      (c) => c.id !== categoryDraft.id && c.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) return setFormError('This category already exists.');
    if (categoryDraft.id) {
      renameCategory(categoryDraft.id, name);
    } else {
      const id = addCategory(name);
      setCategoryId(id);
    }
    reloadMenu();
    setCategoryDraft(null);
  }

  function removeCategory() {
    if (!categoryDraft?.id) return;
    const id = categoryDraft.id;
    if (!deleteCategory(id)) {
      setFormError('Move or delete the items in this category first.');
      return;
    }
    reloadMenu();
    setCategoryId(null);
    setCategoryDraft(null);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Menu</Text>
        <Text style={styles.subtitle}>
          {visible.length} items · {menu.categories.length} categories
        </Text>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {menu.categories.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setCategoryId(c.id)}
              style={[styles.chip, c.id === category?.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, c.id === category?.id && styles.chipTextActive]}>{c.name}</Text>
            </Pressable>
          ))}
          <Pressable
            style={[styles.chip, styles.chipAdd]}
            onPress={() => {
              setFormError(null);
              setCategoryDraft({ id: null, name: '' });
            }}
          >
            <Text style={styles.chipAddText}>+ Category</Text>
          </Pressable>
        </ScrollView>
      </View>

      {category && (
        <View style={styles.categoryBar}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Pressable
            hitSlop={10}
            onPress={() => {
              setFormError(null);
              setCategoryDraft({ id: category.id, name: category.name });
            }}
          >
            <Text style={styles.link}>Edit category</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {category ? 'No items in this category yet.' : 'Start by adding a category, like "Snacks".'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => editItem(item)}>
            <VegMark veg={item.veg} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowName, !item.available && styles.dim]}>{item.name}</Text>
              <Text style={styles.rowSub}>
                {formatRupees(item.price)}
                {item.available ? '' : ' · Out of stock'}
              </Text>
            </View>
            <Switch value={item.available} onValueChange={(v) => toggleAvailable(item, v)} />
          </Pressable>
        )}
      />

      <Pressable style={styles.addItemBtn} onPress={newItem}>
        <Text style={styles.addItemText}>+ Add item</Text>
      </Pressable>

      {itemDraft && (
        <Sheet>
          <Text style={styles.sheetTitle}>{itemDraft.id ? 'Edit item' : 'New item'}</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            value={itemDraft.name}
            onChangeText={(name) => setItemDraft({ ...itemDraft, name })}
            placeholder="e.g. Paneer Butter Masala"
            placeholderTextColor={MUTED}
            style={styles.input}
            autoFocus={!itemDraft.id}
          />

          <Text style={styles.label}>Price (₹, before GST)</Text>
          <TextInput
            value={itemDraft.price}
            onChangeText={(price) => setItemDraft({ ...itemDraft, price })}
            placeholder="e.g. 220"
            placeholderTextColor={MUTED}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.segment}>
            {[true, false].map((veg) => (
              <Pressable
                key={String(veg)}
                style={[styles.segBtn, itemDraft.veg === veg && styles.segBtnActive]}
                onPress={() => setItemDraft({ ...itemDraft, veg })}
              >
                <VegMark veg={veg} />
                <Text style={[styles.segText, itemDraft.veg === veg && styles.segTextActive]}>
                  {veg ? 'Veg' : 'Non-veg'}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {menu.categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setItemDraft({ ...itemDraft, categoryId: c.id })}
                style={[styles.chip, c.id === itemDraft.categoryId && styles.chipActive]}
              >
                <Text style={[styles.chipText, c.id === itemDraft.categoryId && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {formError && <Text style={styles.error}>{formError}</Text>}

          <View style={styles.actions}>
            {itemDraft.id && (
              <Pressable style={styles.deleteBtn} onPress={removeItem}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
            <Pressable style={styles.cancelBtn} onPress={() => setItemDraft(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={saveItem}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Sheet>
      )}

      {categoryDraft && (
        <Sheet>
          <Text style={styles.sheetTitle}>{categoryDraft.id ? 'Edit category' : 'New category'}</Text>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={categoryDraft.name}
            onChangeText={(name) => setCategoryDraft({ ...categoryDraft, name })}
            placeholder="e.g. Chinese"
            placeholderTextColor={MUTED}
            style={styles.input}
            autoFocus
          />
          {formError && <Text style={styles.error}>{formError}</Text>}
          <View style={styles.actions}>
            {categoryDraft.id && (
              <Pressable style={styles.deleteBtn} onPress={removeCategory}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
            <Pressable style={styles.cancelBtn} onPress={() => setCategoryDraft(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={saveCategory}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Sheet>
      )}
    </View>
  );
}

function Sheet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.backdrop}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>{children}</View>
      </KeyboardAvoidingView>
    </View>
  );
}

function VegMark({ veg }: { veg: boolean }) {
  const color = veg ? colors.veg : colors.danger;
  return (
    <View style={[styles.vegMark, { borderColor: color }]}>
      <View style={[styles.vegDot, { backgroundColor: color }]} />
    </View>
  );
}

const INK = colors.ink;
const MUTED = colors.muted;
const ACCENT = colors.brand;
const LINE = colors.line;
const TINT = '#E5EEE9'; // light curry-leaf green for selected things

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.mist, paddingTop: 8 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontFamily: fonts.bold, color: INK },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: MUTED, marginTop: 2 },
  chips: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: '#fff' },
  chipActive: { backgroundColor: INK, borderColor: INK },
  chipText: { color: INK, fontFamily: fonts.regular, fontSize: 14 },
  chipTextActive: { color: '#fff', fontFamily: fonts.semibold },
  chipAdd: { borderStyle: 'dashed', borderColor: ACCENT, backgroundColor: TINT },
  chipAddText: { color: ACCENT, fontSize: 14, fontFamily: fonts.semibold },
  categoryBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 },
  categoryName: { fontSize: 16, fontFamily: fonts.bold, color: INK },
  link: { color: ACCENT, fontFamily: fonts.semibold, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  empty: { color: MUTED, textAlign: 'center', marginTop: 32, fontFamily: fonts.regular, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: LINE },
  rowName: { fontSize: 16, color: INK, fontFamily: fonts.semibold },
  rowSub: { fontFamily: fonts.regular, fontSize: 13, color: MUTED, marginTop: 2 },
  dim: { color: MUTED },
  vegMark: { width: 14, height: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 6, height: 6, borderRadius: 3 },
  addItemBtn: { position: 'absolute', left: 16, right: 16, bottom: 20, height: 52, borderRadius: 12, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  addItemText: { color: '#fff', fontSize: 16, fontFamily: fonts.bold },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 28 },
  sheetTitle: { fontSize: 18, fontFamily: fonts.bold, color: INK, marginBottom: 4 },
  label: { fontFamily: fonts.regular, fontSize: 13, color: MUTED, marginTop: 12, marginBottom: 6 },
  input: { height: 46, borderRadius: 10, borderWidth: 1, borderColor: LINE, paddingHorizontal: 12, fontFamily: fonts.regular, fontSize: 16, color: INK },
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, borderColor: LINE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  segBtnActive: { borderColor: INK, borderWidth: 1.5 },
  segText: { fontSize: 15, color: MUTED, fontFamily: fonts.semibold },
  segTextActive: { color: INK },
  error: { color: colors.danger, marginTop: 10 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  deleteBtn: { height: 48, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.danger, fontFamily: fonts.bold, fontSize: 15 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: LINE, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: INK, fontFamily: fonts.semibold, fontSize: 15 },
  saveBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: INK, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
});
