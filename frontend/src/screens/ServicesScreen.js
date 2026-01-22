import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Surface } from 'react-native-paper';
import ServicesContent from '../components/ServicesContent';

const ServicesScreen = ({ navigation }) => {
  const handleGoHome = () => {
    // Navigate to the "Home" screen defined in the nested navigator
    navigation.navigate('Home');
    // Alternatively, if you want to clear only the nested stack:
    // navigation.popToTop();
  };

  return (
    <Surface style={styles.screenContainer}>
      {/* Top Bar with Back Button and Breadcrumb */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.breadcrumb}>
          <TouchableOpacity onPress={handleGoHome}>
            <Text style={styles.linkText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ServicesContent />
    </Surface>
  );
};

export default ServicesScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#fff'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  backButton: {
    marginRight: 8,
    padding: 8,
  },
  backText: {
    color: 'blue',
    fontSize: 16,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  linkText: {
    color: 'blue',
    fontSize: 16,
    fontWeight: '400',
  },
  separator: {
    fontSize: 14,
    marginHorizontal: 4,
    color: '#555',
  },
  currentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});
