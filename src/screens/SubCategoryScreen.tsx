import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation/CatalogNavigator';
import { getSubCategories, addSubCategory } from '../database/db';
import { Plus, ChevronRight, ArrowLeft, Layers } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'SubCategoryList'>;
type RouteType = RouteProp<CatalogStackParamList, 'SubCategoryList'>;

export const SubCategoryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { categoryId, categoryName } = route.params;

  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubCategoryName, setNewSubCategoryName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadSubCategories = async () => {
    setLoading(true);
    try {
      const data = await getSubCategories(categoryId);
      setSubCategories(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSubCategories();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAddSubCategory = async () => {
    if (!newSubCategoryName.trim()) {
      Alert.alert('Error', 'Sub-category name cannot be empty');
      return;
    }
    try {
      await addSubCategory(categoryId, newSubCategoryName.trim());
      setNewSubCategoryName('');
      setIsAdding(false);
      loadSubCategories();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add sub-category');
    }
  };

  const renderSubCategory = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ProductList', { subCategoryId: item.id, subCategoryName: item.name, categoryId })}
    >
      <View style={styles.cardContent}>
        <Layers size={24} color="#9B59B6" style={{ marginRight: 16 }} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <ChevronRight size={20} color="#BDC3C7" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName} Types</Text>
        <TouchableOpacity style={styles.iconButton} onPress={() => setIsAdding(!isAdding)}>
          <Plus size={24} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      {isAdding && (
        <View style={styles.addCategoryContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Sub-category (e.g., Fancy)"
            value={newSubCategoryName}
            onChangeText={setNewSubCategoryName}
            autoFocus
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddSubCategory}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={subCategories}
          keyExtractor={item => item.id.toString()}
          renderItem={renderSubCategory}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No sub-categories found. Add one above.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  iconButton: { padding: 4 },
  addCategoryContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  input: { flex: 1, backgroundColor: '#F8F9F9', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, color: '#2C3E50', marginRight: 12 },
  addButton: { backgroundColor: '#3498DB', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  listContent: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  categoryName: { fontSize: 18, fontWeight: '600', color: '#2C3E50' },
  emptyText: { textAlign: 'center', marginTop: 32, color: '#7F8C8D', fontSize: 16 }
});
