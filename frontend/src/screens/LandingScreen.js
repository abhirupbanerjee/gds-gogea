// src/screens/LandingScreen.js
import React, { useRef, useContext } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Surface } from 'react-native-paper';

import Header from '../components/Header';
import Footer from '../components/Footer';
import MainContent from '../components/MainContent';
import RepositoryScreen from './RepositoryScreen';
import ServicesScreen from './ServicesScreen';
import SurveyFormScreen from './SurveyFormScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import AboutScreen from './AboutScreen';
import VisionScreen from './VisionScreen';    // ← Import the new screen
import { AuthContext } from '../contexts/AuthContext';
import FrameworkScreen from './FrameworkScreen';
import MaturityModelScreen from './MaturityModelScreen';

const Stack = createNativeStackNavigator();

const LandingScreen = () => {
  const navRef = useRef();
  const { isLoggedIn, logout } = useContext(AuthContext);

  const handleRepositoryPress = () => navRef.current?.navigate('Repository');
  const handleServicesPress   = () => navRef.current?.navigate('Services');
  const handleAboutPress      = () => navRef.current?.navigate('AboutScreen');
  const handleFrameworkPress = () => navRef.current?.navigate('Framework');
  const handleMaturityPress = () => navRef.current?.navigate('MaturityModelScreen');
  const handleAuthPress       = () => {
    if (!isLoggedIn) {
      navRef.current?.navigate('Login');
    } else {
      logout();
    }
  };

  return (
    <Surface style={styles.wrapper}>
      <Header
        onRepositoryPress={handleRepositoryPress}
        onServicesPress={handleServicesPress}
        onAboutPress={handleAboutPress}
        isLoggedIn={isLoggedIn}
        onAuthPress={handleAuthPress}
        onFrameworkPress={handleFrameworkPress}
        onMaturityPress = {handleMaturityPress}
      />

      <View style={styles.navigatorContainer}>
        <NavigationContainer independent ref={navRef}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Pass the nested navigation down to MainContent */}
            <Stack.Screen name="Home">
              {({ navigation }) => (
                <ScrollView contentContainerStyle={styles.contentContainer}>
                  <MainContent navigation={navigation} />
                </ScrollView>
              )}
            </Stack.Screen>

            <Stack.Screen name="Repository" component={RepositoryScreen} />
            <Stack.Screen name="Services" component={ServicesScreen} />
            <Stack.Screen name="SurveyFormScreen" component={SurveyFormScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="AboutScreen" component={AboutScreen} />
            <Stack.Screen name="VisionScreen" component={VisionScreen} />
            <Stack.Screen name="Framework" component={FrameworkScreen} />
            <Stack.Screen name="MaturityModelScreen" component={MaturityModelScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>

      {/* <Footer /> */}
    </Surface>
  );
};

export default LandingScreen;

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  navigatorContainer: { flex: 1 },
  contentContainer: { paddingBottom: 20 },
});
