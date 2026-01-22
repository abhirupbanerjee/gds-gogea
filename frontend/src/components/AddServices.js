// src/screens/AddServices.js
import { IMAGE_BASE_URL2 } from '@env';
import React, { useState, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

const AddServices = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { token, role } = useContext(AuthContext);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    duration: 4000,
  });

  const showSnackbar = (message, duration = 4000) => {
    setSnackbar({ visible: true, message, duration });
  };

  const handleCreate = async () => {
    if (!name.trim() || !description.trim()) {
      return showSnackbar('Please fill both fields.');
    }

    if (role !== 'admin') {
      return showSnackbar('Unauthorized: admin only.');
    }

    try {
      const res = await fetch(`${IMAGE_BASE_URL2}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        showSnackbar('Service created successfully!');
        setName('');
        setDescription('');
      } else {
        const err = await res.json();
        showSnackbar(`Error: ${err.detail || res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      showSnackbar('Network error. Please try again.');
    }
  };

  return (
    <>
      <Surface style={styles.container} elevation={4}>
        <Text style={styles.heading}>Add New Service</Text>

        <TextInput
          label="Service Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          style={[styles.input, styles.textArea]}
        />

        <Button
          mode="contained"
          onPress={handleCreate}
          style={styles.button}
          disabled={!token}
        >
          Create
        </Button>
      </Surface>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
        duration={snackbar.duration}
        style={styles.snackbar}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
};

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
  textArea: {
    minHeight: 80,
  },
  button: {
    marginTop: 16,
  },
  snackbar: {
    bottom: 0,           // ensure it's at the bottom
    position: 'absolute',
  },
});

export default AddServices;
