// AddUsers.js
import {IMAGE_BASE_URL2 } from '@env';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text, TextInput, Button, Snackbar } from 'react-native-paper';

export default function AddUsers() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [organisation, setOrganisation] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const [snackbar, setSnackbar] = React.useState({
    visible: false,
    message: '',
    duration: 4000,
  });

  const showSnackbar = (message, duration = 4000) => {
    setSnackbar({ visible: true, message, duration });
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !organisation.trim()) {
      return showSnackbar('Please fill out all fields.');
    }

    setLoading(true);
    try {
      const res = await fetch(`${IMAGE_BASE_URL2}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role: 'user',           // forced role
          organisation,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showSnackbar(data.message || 'User registered successfully!');
        // reset form
        setName('');
        setEmail('');
        setPassword('');
        setOrganisation('');
      } else {
        showSnackbar(`Error: ${data.detail || res.statusText}`);
      }
    } catch (err) {
      showSnackbar('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Surface style={styles.container} elevation={4}>
        <Text style={styles.heading}>Add New Users</Text>

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
        />

        <TextInput
          label="Organisation"
          value={organisation}
          onChangeText={setOrganisation}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Register
        </Button>
      </Surface>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
        duration={snackbar.duration}
        style={styles.snackbar}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginVertical: 8,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
  },
});
