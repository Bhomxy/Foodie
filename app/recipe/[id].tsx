import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useFoodie } from '@/context/FoodieContext';
import { getRecipe } from '@/lib/recipeRegistry';
import { useColorScheme } from '@/components/useColorScheme';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { markMealCooked } = useFoodie();
  const tint = Colors[colorScheme ?? 'light'].tint;
  const border = colorScheme === 'dark' ? '#333' : '#e8e8e8';

  const recipe = id ? getRecipe(id) : undefined;

  if (!recipe) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missing}>Recipe not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: tint, marginTop: 12 }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: recipe.title }} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.desc}>{recipe.description}</Text>
        <Text style={styles.section}>Ingredients this recipe expects</Text>
        {recipe.ingredientsUsed.map((ing) => (
          <Text key={ing} style={styles.bullet}>
            · {ing}
          </Text>
        ))}
        <Text style={styles.section}>Steps</Text>
        {recipe.steps.map((step) => (
          <View key={step.order} style={[styles.step, { borderColor: border }]}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepNum, { backgroundColor: tint }]}>
                <Text style={styles.stepNumText}>{step.order}</Text>
              </View>
              <Text style={styles.stepTitle}>{step.title}</Text>
            </View>
            <Text style={styles.stepDetail}>{step.detail}</Text>
            {step.durationMinutes != null ? (
              <Text style={styles.duration}>~{step.durationMinutes} min</Text>
            ) : null}
          </View>
        ))}
        <Pressable
          onPress={() => {
            markMealCooked(recipe.id);
            router.back();
          }}
          style={({ pressed }) => [
            styles.doneBtn,
            { backgroundColor: tint, opacity: pressed ? 0.9 : 1 },
          ]}>
          <FontAwesome name="check" size={18} color="#fff" />
          <Text style={styles.doneText}>Mark cooked (use foodstuff)</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  missing: { fontSize: 16 },
  desc: { fontSize: 16, lineHeight: 24, marginBottom: 20, opacity: 0.85 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 10, marginTop: 8 },
  bullet: { fontSize: 15, marginBottom: 4, opacity: 0.85 },
  step: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: 'transparent' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNumText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stepTitle: { fontSize: 17, fontWeight: '600', flex: 1 },
  stepDetail: { fontSize: 15, lineHeight: 22, opacity: 0.85 },
  duration: { fontSize: 13, opacity: 0.6, marginTop: 8 },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 24,
  },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
