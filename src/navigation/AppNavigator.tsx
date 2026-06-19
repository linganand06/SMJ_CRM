import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LayoutDashboard, Users, BellRing, LogOut, UserCircle } from 'lucide-react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LeadListScreen } from '../screens/LeadListScreen';
import { CreateLeadScreen } from '../screens/CreateLeadScreen';
import { FollowUpScreen } from '../screens/FollowUpScreen';
import { CustomerListScreen } from '../screens/CustomerListScreen';
import { CustomerOrdersScreen } from '../screens/CustomerOrdersScreen';
import { CatalogNavigator } from './CatalogNavigator';

import { LeadDetailScreen } from '../screens/LeadDetailScreen';

export type LeadsStackParamList = {
  LeadList: undefined;
  CreateLead: undefined;
  LeadDetail: { lead: any };
};

export type CustomerStackParamList = {
  CustomerList: undefined;
  CustomerOrders: { customer: any };
};

const LeadsStack = createNativeStackNavigator<LeadsStackParamList>();

const LeadsNavigator = () => (
  <LeadsStack.Navigator screenOptions={{ headerShown: false }}>
    <LeadsStack.Screen name="LeadList" component={LeadListScreen} />
    <LeadsStack.Screen name="CreateLead" component={CreateLeadScreen} />
    <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreen} />
  </LeadsStack.Navigator>
);

const CustomersStack = createNativeStackNavigator<CustomerStackParamList>();

const CustomersNavigator = () => (
  <CustomersStack.Navigator screenOptions={{ headerShown: false }}>
    <CustomersStack.Screen name="CustomerList" component={CustomerListScreen} />
    <CustomersStack.Screen name="CustomerOrders" component={CustomerOrdersScreen} />
  </CustomersStack.Navigator>
);

export type DrawerParamList = {
  Dashboard: undefined;
  Catalog: undefined;
  Leads: undefined;
  Customers: undefined;
  FollowUps: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const CustomDrawerContent = (props: any) => {
  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props} contentContainerStyle={{ backgroundColor: '#2C3E50' }}>
        <View style={styles.drawerHeader}>
          <UserCircle size={60} color="#FFFFFF" strokeWidth={1.5} />
          <Text style={styles.drawerHeaderText}>SMJ Sales</Text>
          <Text style={styles.drawerSubText}>Admin User</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: 10 }}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.logoutButton} onPress={() => props.navigation.replace('Login')}>
          <LogOut size={22} color="#E74C3C" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DrawerNavigator = () => (
  <Drawer.Navigator 
    initialRouteName="Dashboard" 
    drawerContent={(props) => <CustomDrawerContent {...props} />}
    screenOptions={{ 
      headerStyle: { backgroundColor: '#F5F7FA' }, 
      headerShadowVisible: false,
      drawerActiveBackgroundColor: '#E8F4F8',
      drawerActiveTintColor: '#3498DB',
      drawerInactiveTintColor: '#34495E',
      drawerLabelStyle: { fontSize: 15, marginLeft: -10, fontWeight: '600' }
    }}
  >
    <Drawer.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{
        drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
      }}
    />
    <Drawer.Screen 
      name="Catalog" 
      component={CatalogNavigator} 
      options={{
        title: 'Product Catalog',
        drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />
      }}
    />
    <Drawer.Screen 
      name="Customers" 
      component={CustomersNavigator} 
      options={{
        title: 'Customer Management',
        drawerIcon: ({ color, size }) => <Users size={size} color={color} />
      }}
    />
    <Drawer.Screen 
      name="Leads" 
      component={LeadsNavigator} 
      options={{
        title: 'Lead Management',
        drawerIcon: ({ color, size }) => <Users size={size} color={color} />
      }}
    />
    <Drawer.Screen 
      name="FollowUps" 
      component={FollowUpScreen} 
      options={{ 
        title: 'Follow-ups',
        drawerIcon: ({ color, size }) => <BellRing size={size} color={color} />
      }} 
    />
  </Drawer.Navigator>
);

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={DrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#34495E',
    backgroundColor: '#2C3E50',
    marginTop: -4,
  },
  drawerHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  drawerSubText: {
    color: '#BDC3C7',
    fontSize: 14,
    marginTop: 4,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F3F4',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  }
});
