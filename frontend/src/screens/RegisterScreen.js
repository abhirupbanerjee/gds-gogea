// src/screens/RegisterScreen.js
import {IMAGE_BASE_URL2 } from '@env';
import React, { useContext, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Surface,
  TextInput,
  Button,
  Title,
  Provider as PaperProvider,
  DefaultTheme,
  Snackbar
} from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

const theme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    background: '#f2f2f2',
    surface: '#ffffff',
    text: '#000000',
  }
};

export default function RegisterScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const [name, setName]                     = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organisation, setOrganisation]     = useState('');

  // Snackbar state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg]         = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setSnackbarMsg('Error: Passwords do not match.');
      setSnackbarVisible(true);
      return;
    }

    try {
      const res = await fetch(
        `${IMAGE_BASE_URL2}/register_pending`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            organisation,
            role: 'user'           // default role
          })
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setSnackbarMsg(`Error: ${data.detail || 'Registration failed.'}`);
      } else {
        setSnackbarMsg(data.message || 'Registration submitted for approval.');
        // navigate to Login after a short delay
        setTimeout(() => navigation.navigate('Login'), 1500);
      }
      setSnackbarVisible(true);
    } catch (err) {
      setSnackbarMsg(`Registration Error: ${err.message}`);
      setSnackbarVisible(true);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <ScrollView contentContainerStyle={styles.outerContainer}>
        <Surface style={styles.card}>
          <Title style={styles.title}>Register</Title>

          {[
            { label: 'Name',             value: name,          setter: setName },
            { label: 'Email',            value: email,         setter: setEmail,       keyboard: 'email-address', autoCap: 'none' },
            { label: 'Password',         value: password,      setter: setPassword,    secure: true,           autoCap: 'none' },
            { label: 'Confirm Password', value: confirmPassword, setter: setConfirmPassword, secure: true, autoCap: 'none' },
            { label: 'Organisation',     value: organisation,  setter: setOrganisation }
          ].map((fld, i) => (
            <TextInput
              key={i}
              mode="outlined"
              label={fld.label}
              value={fld.value}
              onChangeText={fld.setter}
              secureTextEntry={fld.secure}
              autoCapitalize={fld.autoCap || 'sentences'}
              keyboardType={fld.keyboard || 'default'}
              style={styles.input}
              theme={{ colors: { primary: theme.colors.primary } }}
            />
          ))}

          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Submit for Approval
          </Button>

          <View style={styles.loginLink}>
            <Button mode="text" onPress={() => navigation.navigate('Login')}>
              Already have an account? Login
            </Button>
          </View>
        </Surface>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'OK',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMsg}
        </Snackbar>
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: theme.roundness,
    elevation: 4,
    backgroundColor: theme.colors.surface,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
  },
  input: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginLink: {
    marginTop: 12,
    alignItems: 'center',
  },
});
