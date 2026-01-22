// src/screens/FrameworkScreen.js
import React from 'react';
import { ScrollView, StyleSheet,View,TouchableOpacity } from 'react-native';
import { Surface,Paragraph } from 'react-native-paper';
import FrameworkContent from '../components/FrameworkContent';

const FrameworkScreen = ({ navigation }) => {
  const handleGoHome = () => {
    // Navigate back to the "Home" screen in the nested navigator
    navigation.navigate('Home');
  };
  return (
    <Surface style={styles.container}>
         <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Paragraph style={styles.backText}>Back</Paragraph>
              </TouchableOpacity>
      
              <TouchableOpacity onPress={handleGoHome} style={styles.homeButton}>
                <Paragraph style={styles.homeText}>Home</Paragraph>
              </TouchableOpacity>
            </View>
      <ScrollView contentContainerStyle={styles.content}>
        <FrameworkContent />
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
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
  }
});

export default FrameworkScreen;
