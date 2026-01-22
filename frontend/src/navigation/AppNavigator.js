// AppNavigator.js
import React from 'react';
import {UI_URL_PREFIX} from '@env';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import LandingScreen from '../screens/LandingScreen';
import RepositoryScreen from '../screens/RepositoryScreen';
import ServicesScreen from '../screens/ServicesScreen';
import SurveyFormScreen from '../screens/SurveyFormScreen';
import AboutScreen from '../screens/AboutScreen'; // Import AboutScreen
import FrameworkScreen from '../screens/FrameworkScreen';
import MaturityModelScreen from '../screens/MaturityModelScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: [UI_URL_PREFIX],
  config: {
    screens: {
      Landing: '/',
      RepositoryScreen: '/repository',
      ServicesScreen: '/services',
      SurveyFormScreen: '/survey',
      AboutScreen: '/about', // Linking configuration for AboutScreen
      FrameworkScreen: '/framework',
      MaturityModelScreen: '/maturity',
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="RepositoryScreen" component={RepositoryScreen} />
        <Stack.Screen name="ServicesScreen" component={ServicesScreen} />
        <Stack.Screen name="SurveyFormScreen" component={SurveyFormScreen} />
        <Stack.Screen name="AboutScreen" component={AboutScreen} />
        <Stack.Screen name="FrameworkScreen" component={FrameworkScreen} />
        <Stack.Screen name="MaturityModelScreen" component={MaturityModelScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
