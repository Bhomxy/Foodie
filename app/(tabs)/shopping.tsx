import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFoodie } from '@/context/FoodieContext';
import { useColorScheme } from '@/components/useColorScheme';

export default function ShoppingScreen() {
  const colorScheme = useColorScheme();
  const {
    shoppingList,
    addShoppingItem,
    addLowStockToShopping,
    toggleShoppingItem,
    removeShoppingItem,
    clearDoneShopping,
  } = useFoodie();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const border = colorScheme === 'dark' ? '#333' : '#ddd';
  const textColor = colorScheme === 'dark' ? '#fff' : '#000';

  const [name, setName] = useState('');

  const onAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addShoppingItem(trimmed);
    setName('');
  };

  const pending = shoppingList.filter((s) => !s.done);
  const done = shoppingList.filter((s) => s.done);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={shoppingList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={styles.heading}>Shopping list</Text>
            <Text style={styles.sub}>
              Check off items as you shop. Use "Add low stock" to pull in items running low in your pantry.
            </Text>

            {/* Add item row */}
            <View style={[styles.inputRow, { borderColor: border }]}>
              <TextInput
                placeholder="Add an item…"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                onSubmitEditing={onAdd}
                returnKeyType="done"
                style={[styles.input, { color: textColor }]}
              />
              <Pressable
                onPress={onAdd}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: tint, opacity: pressed ? 0.85 : 1 },
                ]}>
                <FontAwesome name="plus" size={16} color="#fff" />
              </Pressable>
            </View>

            {/* Quick actions */}
            <View style={styles.actionsRow}>
              <Pressable
                onPress={addLowStockToShopping}
                style={({ pressed }) => [
                  styles.actionChip,
                  { borderColor: tint, backgroundColor: `${tint}12`, opacity: pressed ? 0.8 : 1 },
                ]}>
                <FontAwesome name="shopping-basket" size={13} color={tint} />
                <Text style={[styles.actionLabel, { color: tint }]}>Add low stock</Text>
              </Pressable>

              {done.length > 0 ? (
                <Pressable
                  onPress={clearDoneShopping}
                  style={({ pressed }) => [
                    styles.actionChip,
                    { borderColor: '#c0392b', backgroundColor: 'transparent', opacity: pressed ? 0.8 : 1 },
                  ]}>
                  <FontAwesome name="trash" size={13} color="#c0392b" />
                  <Text style={[styles.actionLabel, { color: '#c0392b' }]}>Clear done ({done.length})</Text>
                </Pressable>
              ) : null}
            </View>

            {pending.length > 0 ? (
              <Text style={styles.sectionTitle}>To get ({pending.length})</Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => toggleShoppingItem(item.id)}
            style={({ pressed }) => [
              styles.itemRow,
              { borderColor: border, opacity: pressed ? 0.85 : 1 },
            ]}>
            <FontAwesome
              name={item.done ? 'check-circle' : 'circle-o'}
              size={22}
              color={item.done ? tint : '#aaa'}
              style={{ marginRight: 12 }}
            />
            <View style={styles.itemText}>
              <Text style={[styles.itemName, item.done && styles.strikethrough]}>
                {item.name}
              </Text>
              {item.note ? (
                <Text style={styles.itemNote}>{item.note}</Text>
              ) : null}
            </View>
            <Pressable onPress={() => removeShoppingItem(item.id)} hitSlop={12}>
              <FontAwesome name="trash" size={18} color="#c0392b" style={{ marginLeft: 10 }} />
            </Pressable>
          </Pressable>
        )}
        ListFooterComponent={
          done.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.sectionTitle, { opacity: 0.5 }]}>Done ({done.length})</Text>
              {done.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleShoppingItem(item.id)}
                  style={({ pressed }) => [
                    styles.itemRow,
                    { borderColor: border, opacity: pressed ? 0.7 : 0.55 },
                  ]}>
                  <FontAwesome name="check-circle" size={22} color={tint} style={{ marginRight: 12 }} />
                  <View style={styles.itemText}>
                    <Text style={[styles.itemName, styles.strikethrough]}>{item.name}</Text>
                    {item.note ? <Text style={styles.itemNote}>{item.note}</Text> : null}
                  </View>
                  <Pressable onPress={() => removeShoppingItem(item.id)} hitSlop={12}>
                    <FontAwesome name="trash" size={18} color="#c0392b" style={{ marginLeft: 10 }} />
                  </Pressable>
                </Pressable>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <FontAwesome name="check-circle" size={40} color={tint} style={{ opacity: 0.4, marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptySub}>
              Add items above or tap "Add low stock" to pull in items running low in your pantry.
            </Text>
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
  sub: { fontSize: 15, opacity: 0.75, marginBottom: 16, lineHeight: 22 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  itemText: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemNote: { fontSize: 13, opacity: 0.6, marginTop: 2 },
  strikethrough: { textDecorationLine: 'line-through', opacity: 0.5 },
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 15, opacity: 0.65, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
});
