// RepositoryScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import RepositoryContent from '../components/RepositoryContent';

const RepositoryScreen = ({ navigation }) => {
  const handleGoHome = () => {
    navigation.navigate('Home');
  };
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <Surface style={styles.screenContainer}>
      {/* Top Bar with Back and Home */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
          <Text style={styles.linkText}>Home</Text>
        </TouchableOpacity>
      </View>

      <RepositoryContent
        selectedCategory={selectedCategory}
        onCategoryPress={(category) => setSelectedCategory(category)}
      />
    </Surface>
  );
};

export default RepositoryScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between', // Ensures Back is left, Home is right
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
  linkText: {
    color: 'blue',
    fontSize: 16,
    fontWeight: '400',
  },
});
