import React, { useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { initDatabase } from './src/database/db';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize the SQLite database and seed the super admin
    initDatabase();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f7faff" />
      <AppNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
});

export default App;
