import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { DEFAULT_FOOD_UNIT, FOOD_UNITS, type FoodUnit } from '@/constants/foodUnits';
import { getLowStockItems } from '@/lib/lowStock';
import { useFoodie } from '@/context/FoodieContext';
import { useColorScheme } from '@/components/useColorScheme';

export default function FoodstuffScreen() {
  const colorScheme = useColorScheme();
  const { pantry, reminders, addPantryItem, removePantryItem, updatePantryItem } = useFoodie();
  const lowStock = getLowStockItems(pantry, reminders.lowStock.threshold);
  const tint = Colors[colorScheme ?? 'light'].tint;
  const border = colorScheme === 'dark' ? '#333' : '#ddd';
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';

  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<FoodUnit>(DEFAULT_FOOD_UNIT);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);

  const onAdd = () => {
    const q = parseFloat(quantity);
    if (!name.trim() || Number.isNaN(q)) return;
    addPantryItem({ name: name.trim(), quantity: q, unit, expiresAt, parLevel: null });
    setName('');
    setQuantity('1');
    setUnit(DEFAULT_FOOD_UNIT);
    setExpiresAt(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Modal visible={unitPickerOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setUnitPickerOpen(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { borderColor: border, backgroundColor: colorScheme === 'dark' ? '#1c1c1c' : '#fff' }]}>
                <Text style={styles.modalTitle}>Unit</Text>
                <FlatList
                  data={[...FOOD_UNITS]}
                  keyExtractor={(u) => u}
                  style={styles.unitList}
                  renderItem={({ item: u }) => (
                    <Pressable
                      onPress={() => {
                        setUnit(u);
                        setUnitPickerOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.unitRow,
                        { opacity: pressed ? 0.75 : 1, backgroundColor: u === unit ? `${tint}22` : 'transparent' },
                      ]}>
                      <Text style={[styles.unitRowText, { color: textColor }]}>{u}</Text>
                      {u === unit ? <FontAwesome name="check" size={16} color={tint} /> : null}
                    </Pressable>
                  )}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <FlatList
        data={pantry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Foodstuff</Text>
            <Text style={styles.sub}>
              Track what’s in your pantry so meal plans and low-stock nudges stay accurate.
            </Text>
            {lowStock.length > 0 ? (
              <View style={[styles.lowBanner, { borderColor: '#c0392b', backgroundColor: `${tint}12` }]}>
                <FontAwesome name="exclamation-circle" size={18} color="#c0392b" style={{ marginRight: 10 }} />
                <View style={styles.lowBannerText}>
                  <Text style={styles.lowBannerTitle}>Running low</Text>
                  <Text style={styles.lowBannerSub}>
                    {lowStock.map((i) => `${i.name} (${i.quantity} ${i.unit})`).join(' · ')}
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={[styles.form, { borderColor: border }]}>
              <TextInput
                placeholder="Item name (e.g. rolled oats)"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                style={[styles.input, { borderColor: border, color: textColor }]}
              />
              <View style={styles.row}>
                <TextInput
                  placeholder="Qty"
                  placeholderTextColor="#888"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  style={[styles.input, styles.inputQty, { borderColor: border, color: textColor }]}
                />
                <Pressable
                  onPress={() => setUnitPickerOpen(true)}
                  style={({ pressed }) => [
                    styles.unitField,
                    { borderColor: border, opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <Text style={[styles.unitFieldText, { color: textColor }]}>{unit}</Text>
                  <FontAwesome name="chevron-down" size={14} color={tint} />
                </Pressable>
              </View>
              <Pressable
                onPress={() => setDatePickerOpen(true)}
                style={({ pressed }) => [
                  styles.input,
                  styles.dateField,
                  { borderColor: border, opacity: pressed ? 0.8 : 1 },
                ]}>
                <Text style={[styles.dateFieldText, { color: expiresAt ? textColor : '#888' }]}>
                  {expiresAt ?? 'Expiry date (optional)'}
                </Text>
                {expiresAt ? (
                  <Pressable
                    onPress={() => setExpiresAt(null)}
                    hitSlop={10}>
                    <FontAwesome name="times-circle" size={16} color="#888" />
                  </Pressable>
                ) : (
                  <FontAwesome name="calendar" size={15} color="#888" />
                )}
              </Pressable>
              {datePickerOpen && (
                <DateTimePicker
                  value={expiresAt ? new Date(expiresAt + 'T12:00:00') : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(_e, date) => {
                    setDatePickerOpen(Platform.OS === 'ios');
                    if (date) {
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, '0');
                      const d = String(date.getDate()).padStart(2, '0');
                      setExpiresAt(`${y}-${m}-${d}`);
                    }
                  }}
                />
              )}
              <Pressable
                onPress={onAdd}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: tint, opacity: pressed ? 0.9 : 1 },
                ]}>
                <Text style={styles.addBtnText}>Add foodstuff</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionTitle}>In your pantry</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={[styles.itemRow, { borderColor: border }]}>
            <View style={styles.itemMain}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {item.quantity} {item.unit}
                {item.expiresAt ? ` · expires ${item.expiresAt}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                const next = Math.max(0, item.quantity - 1);
                if (next === 0) removePantryItem(item.id);
                else updatePantryItem(item.id, { quantity: next });
              }}
              hitSlop={12}>
              <FontAwesome name="minus-circle" size={22} color={tint} />
            </Pressable>
            <Pressable onPress={() => removePantryItem(item.id)} hitSlop={12}>
              <FontAwesome name="trash" size={20} color="#c0392b" style={{ marginLeft: 12 }} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <FontAwesome name="shopping-basket" size={40} color={tint} style={{ opacity: 0.5, marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No foodstuff in your pantry</Text>
            <Text style={styles.emptySub}>Add items above to get meal ideas that match what you have.</Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  heading: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 15, opacity: 0.75, marginBottom: 16 },
  form: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 24 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  inputQty: { flex: 1, marginBottom: 10 },
  unitField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    minHeight: 44,
  },
  unitFieldText: { fontSize: 16 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  dateFieldText: { fontSize: 16 },
  addBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  itemMain: { flex: 1 },
  itemName: { fontSize: 17, fontWeight: '600' },
  itemMeta: { fontSize: 14, opacity: 0.7, marginTop: 4 },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 15, opacity: 0.65, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  lowBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  lowBannerText: { flex: 1 },
  lowBannerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, color: '#c0392b' },
  lowBannerSub: { fontSize: 14, lineHeight: 20, opacity: 0.9 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalSheet: {
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: '55%',
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', padding: 16, paddingBottom: 8 },
  unitList: { maxHeight: 320 },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  unitRowText: { fontSize: 16 },
});
