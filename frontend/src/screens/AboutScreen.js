// AboutScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import AboutContent from '../components/AboutContent';

const AboutScreen = ({ navigation }) => {
  const handleGoHome = () => {
    // Navigate back to the "Home" screen in the nested navigator
    navigation.navigate('Home');
  };

  return (
    <Surface style={styles.screenContainer}>
      {/* Top Bar with Back Button on left, Home link on right */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
          <Text style={styles.homeText}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* Main About content */}
      <AboutContent />
    </Surface>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',  // push items to edges
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 50,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: 'blue',
    fontSize: 16,
  },
  homeButton: {
    padding: 8,
  },
  homeText: {
    color: 'blue',
    fontSize: 16,
    fontWeight: '400',
  },
});
