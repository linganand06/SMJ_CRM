import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoryScreen } from '../screens/CategoryScreen';
import { SubCategoryScreen } from '../screens/SubCategoryScreen';
import { ProductListScreen } from '../screens/ProductListScreen';
import { AddProductScreen } from '../screens/AddProductScreen';

export type CatalogStackParamList = {
  CategoryList: undefined;
  SubCategoryList: { categoryId: number; categoryName: string };
  ProductList: { subCategoryId: number; subCategoryName: string; categoryId: number };
  AddProduct: { subCategoryId: number; categoryId: number; editProduct?: any };
};

const Stack = createNativeStackNavigator<CatalogStackParamList>();

export const CatalogNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CategoryList" component={CategoryScreen} />
      <Stack.Screen name="SubCategoryList" component={SubCategoryScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
    </Stack.Navigator>
  );
};
