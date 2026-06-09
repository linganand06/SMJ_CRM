import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LeadListScreen } from '../screens/LeadListScreen';
import { CreateLeadScreen } from '../screens/CreateLeadScreen';

import { LeadDetailScreen } from '../screens/LeadDetailScreen';

export type LeadsStackParamList = {
  LeadList: undefined;
  CreateLead: undefined;
  LeadDetail: { lead: any };
};

const LeadsStack = createNativeStackNavigator<LeadsStackParamList>();

const LeadsNavigator = () => (
  <LeadsStack.Navigator screenOptions={{ headerShown: false }}>
    <LeadsStack.Screen name="LeadList" component={LeadListScreen} />
    <LeadsStack.Screen name="CreateLead" component={CreateLeadScreen} />
    <LeadsStack.Screen name="LeadDetail" component={LeadDetailScreen} />
  </LeadsStack.Navigator>
);

export type DrawerParamList = {
  Dashboard: undefined;
  Leads: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => (
  <Drawer.Navigator initialRouteName="Dashboard" screenOptions={{ headerStyle: { backgroundColor: '#F5F7FA' }, headerShadowVisible: false }}>
    <Drawer.Screen name="Dashboard" component={DashboardScreen} />
    <Drawer.Screen name="Leads" component={LeadsNavigator} />
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
