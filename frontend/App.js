// App.js
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/contexts/AuthContext';
import LandingScreen from './src/screens/LandingScreen';

const App = () => {
  return (
    <PaperProvider>
      <AuthProvider>
        <SafeAreaView style={styles.container}>
          <LandingScreen />
        </SafeAreaView>
      </AuthProvider>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
