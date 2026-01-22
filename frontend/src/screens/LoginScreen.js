// src/screens/LoginScreen.js
import {IMAGE_BASE_URL2 } from '@env';
import React, { useContext, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import {
  Surface,
  TextInput,
  Button,
  Title,
  Snackbar,
  ActivityIndicator
} from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useContext(AuthContext);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Snackbar state
  const [snackMsg, setSnackMsg]         = useState('');
  const [snackVisible, setSnackVisible] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${IMAGE_BASE_URL2}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      });

      if (!resp.ok) throw new Error('Invalid email or password');

      const { access_token, role } = await resp.json();
      login(access_token, role);
      navigation.navigate('Home');
    } catch (err) {
      setSnackMsg(err.message);
      setSnackVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Surface style={styles.container}>
        <Title style={styles.title}>Login</Title>

        <TextInput
          label="Email"
          placeholder="you@example.com"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          label="Password"
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          disabled={loading}
          style={styles.button}
        >
          {loading ? <ActivityIndicator animating color="#fff" /> : 'Login'}
        </Button>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            Don't have an account? Register
          </Text>
        </TouchableOpacity>
      </Surface>

      {/* Snackbar */}
      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2500}
        action={{ label: 'OK', onPress: () => setSnackVisible(false) }}
      >
        {snackMsg}
      </Snackbar>
    </View>
  );
}

/* ─────────────────── Styles ─────────────────── */
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: 300,
    padding: 20,
    borderRadius: 8,
    elevation: 4,
    backgroundColor: '#fff'
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold'
  },
  input: {
    marginVertical: 8
  },
  button: {
    marginTop: 16
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center'
  },
  registerText: {
    color: 'blue'
  }
});
