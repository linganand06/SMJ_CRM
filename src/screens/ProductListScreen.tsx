import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Image, Alert, Modal, Pressable
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation/CatalogNavigator';
import { getProducts, deleteProduct } from '../database/db';
import { Plus, ArrowLeft, Pencil, Trash2, MoreVertical } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'ProductList'>;
type RouteType = RouteProp<CatalogStackParamList, 'ProductList'>;

export const ProductListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { subCategoryId, subCategoryName, categoryId } = route.params;

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuProduct, setMenuProduct] = useState<any | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts(subCategoryId);
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [])
  );

  const handleEdit = (product: any) => {
    setMenuProduct(null);
    navigation.navigate('AddProduct', {
      subCategoryId,
      categoryId,
      editProduct: product,
    });
  };

  const handleDelete = (product: any) => {
    setMenuProduct(null);
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product.');
              console.error(error);
            }
          }
        }
      ]
    );
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_uri }}
        style={styles.productImage}
        resizeMode="cover"
      />

      {/* Three-dot menu button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setMenuProduct(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MoreVertical size={18} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        {item.price ? <Text style={styles.productPrice}>₹{item.price}</Text> : null}
        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Inline Edit / Delete row */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
            <Pencil size={14} color="#3498DB" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <Trash2 size={14} color="#E74C3C" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subCategoryName}</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('AddProduct', { subCategoryId, categoryId })}
        >
          <Plus size={24} color="#2C3E50" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3498DB" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id.toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No products found. Tap + to add one.</Text>
          }
        />
      )}

      {/* Context menu modal */}
      <Modal
        transparent
        visible={!!menuProduct}
        animationType="fade"
        onRequestClose={() => setMenuProduct(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuProduct(null)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle} numberOfLines={1}>
              {menuProduct?.name}
            </Text>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => handleEdit(menuProduct)}>
              <Pencil size={18} color="#3498DB" />
              <Text style={[styles.menuItemText, { color: '#3498DB' }]}>Edit Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleDelete(menuProduct)}>
              <Trash2 size={18} color="#E74C3C" />
              <Text style={[styles.menuItemText, { color: '#E74C3C' }]}>Delete Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, styles.cancelItem]} onPress={() => setMenuProduct(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED'
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  iconButton: { padding: 4 },
  listContent: { padding: 12 },
  row: { justifyContent: 'space-between' },

  card: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, overflow: 'hidden'
  },
  productImage: { width: '100%', height: 140, backgroundColor: '#E0E6ED' },
  menuButton: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16, padding: 4
  },
  productInfo: { padding: 10 },
  productName: { fontSize: 14, fontWeight: '700', color: '#2C3E50', marginBottom: 2 },
  productPrice: { fontSize: 13, fontWeight: '700', color: '#16A085', marginBottom: 2 },
  productDesc: { fontSize: 11, color: '#7F8C8D', marginBottom: 8, lineHeight: 15 },

  actionRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#3498DB', gap: 4
  },
  editBtnText: { fontSize: 12, fontWeight: '600', color: '#3498DB' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E74C3C', gap: 4
  },
  deleteBtnText: { fontSize: 12, fontWeight: '600', color: '#E74C3C' },

  emptyText: { textAlign: 'center', marginTop: 60, color: '#7F8C8D', fontSize: 16 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center'
  },
  menuCard: {
    width: 260, backgroundColor: '#FFFFFF', borderRadius: 16,
    overflow: 'hidden', elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  menuTitle: {
    fontSize: 15, fontWeight: '700', color: '#2C3E50',
    paddingHorizontal: 20, paddingVertical: 14
  },
  menuDivider: { height: 1, backgroundColor: '#F0F3F4' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0F3F4'
  },
  menuItemText: { fontSize: 15, fontWeight: '600' },
  cancelItem: { borderBottomWidth: 0, justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: '#7F8C8D', textAlign: 'center', width: '100%' }
});
