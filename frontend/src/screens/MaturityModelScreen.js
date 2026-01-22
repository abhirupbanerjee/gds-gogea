import React from 'react';
import { Surface } from 'react-native-paper';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import MaturityModelContent from '../components/MaturityModelContent';
import Footer from '../components/Footer';

const MaturityModelScreen = ({ navigation }) => {
  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  return (
    <Surface style={styles.screenContainer}>
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

      <MaturityModelContent />
      {/* <Footer /> */}
    </Surface>
  );
};

export default MaturityModelScreen;

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
});
