import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, KeyboardAvoidingView, Platform, PermissionsAndroid, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CatalogStackParamList } from '../navigation/CatalogNavigator';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { addProduct, updateProduct } from '../database/db';
import { ArrowLeft, Save, Camera, Image as ImageIcon } from 'lucide-react-native';

type NavigationProp = NativeStackNavigationProp<CatalogStackParamList, 'AddProduct'>;
type RouteType = RouteProp<CatalogStackParamList, 'AddProduct'>;

export const AddProductScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { subCategoryId, categoryId, editProduct } = route.params;

  const isEditMode = !!editProduct;

  const [formData, setFormData] = useState({
    name: editProduct?.name || '',
    description: editProduct?.description || '',
    price: editProduct?.price || '',
    image_uri: editProduct?.image_uri || ''
  });

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: "Camera Permission",
            message: "App needs camera permission to take photos.",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert("Permission Denied", "Camera permission is required to take photos.");
        return;
      }
      launchCamera({ mediaType: 'photo', saveToPhotos: true }, (res) => {
        if (res.assets && res.assets.length > 0) {
          setFormData({ ...formData, image_uri: res.assets[0].uri || '' });
        }
      });
    } else {
      launchImageLibrary({ mediaType: 'photo' }, (res) => {
        if (res.assets && res.assets.length > 0) {
          setFormData({ ...formData, image_uri: res.assets[0].uri || '' });
        }
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.image_uri) {
      Alert.alert('Validation Error', 'Product name and image are required.');
      return;
    }

    try {
      const productData = {
        category_id: categoryId,
        sub_category_id: subCategoryId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price.trim(),
        image_uri: formData.image_uri
      };

      if (isEditMode) {
        await updateProduct(editProduct.id, productData);
        Alert.alert('Success', 'Product updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await addProduct(productData);
        Alert.alert('Success', 'Product added successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', isEditMode ? 'Failed to update product.' : 'Failed to add product.');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Product' : 'Add Product'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.formContainer}>
          
          <View style={styles.imageSection}>
            {formData.image_uri ? (
              <Image source={{ uri: formData.image_uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={48} color="#BDC3C7" />
                <Text style={styles.placeholderText}>No Image Selected</Text>
              </View>
            )}
            
            <View style={styles.imageButtonsRow}>
              <TouchableOpacity style={styles.imageButton} onPress={() => pickImage('camera')}>
                <Camera size={20} color="#FFFFFF" />
                <Text style={styles.imageButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.imageButton, { backgroundColor: '#9B59B6' }]} onPress={() => pickImage('gallery')}>
                <ImageIcon size={20} color="#FFFFFF" />
                <Text style={styles.imageButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Product Name <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Silver Chain"
              placeholderTextColor="#BDC3C7"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500"
              placeholderTextColor="#BDC3C7"
              keyboardType="numeric"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Product details..."
              placeholderTextColor="#BDC3C7"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
            />
          </View>

          <TouchableOpacity style={[styles.primaryBtn, isEditMode && { backgroundColor: '#E67E22' }]} onPress={handleSave}>
            <Save size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>{isEditMode ? 'Update Product' : 'Save Product'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E6ED' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  formContainer: { flex: 1, padding: 16 },
  imageSection: { alignItems: 'center', marginBottom: 24 },
  previewImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 16, backgroundColor: '#E0E6ED' },
  imagePlaceholder: { width: 200, height: 200, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#E0E6ED', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  placeholderText: { marginTop: 12, color: '#7F8C8D', fontWeight: '500' },
  imageButtonsRow: { flexDirection: 'row', gap: 12 },
  imageButton: { flexDirection: 'row', backgroundColor: '#3498DB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  imageButtonText: { color: '#FFFFFF', marginLeft: 8, fontWeight: '600' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#34495E', marginBottom: 8 },
  required: { color: '#E74C3C' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E6ED', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2C3E50' },
  primaryBtn: { flexDirection: 'row', backgroundColor: '#2ECC71', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 40 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
