// src/components/UserApproval.js
import {IMAGE_BASE_URL2} from '@env';
import React, { useEffect, useState, useContext } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Surface,
  Card,
  Title,
  Paragraph,
  Button,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';

export default function UserApproval() {
  const { token, role } = useContext(AuthContext);
  const [pendingUsers, setPendingUsers]   = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [snackbarMsg, setSnackbarMsg]     = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${IMAGE_BASE_URL2}/admin/pending_users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setPendingUsers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && role === 'admin') fetchPending();
  }, [token, role]);

  const handleApprove = async (temp_user_id) => {
    try {
      const res = await fetch(`${IMAGE_BASE_URL2}/admin/approve_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ temp_user_id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Approval failed');
      setPendingUsers(pendingUsers.filter(u => u.temp_user_id !== temp_user_id));
      setSnackbarMsg(data.message || 'User approved');
    } catch (e) {
      setSnackbarMsg(`Error: ${e.message}`);
    } finally {
      setSnackbarVisible(true);
    }
  };

  if (!token || role !== 'admin') {
    return (
      <Surface style={styles.center}>
        <Paragraph>You must be an admin to view this.</Paragraph>
      </Surface>
    );
  }

  if (loading) {
    return (
      <Surface style={styles.center}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  if (error) {
    return (
      <Surface style={styles.center}>
        <Paragraph style={styles.error}>{error}</Paragraph>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      {pendingUsers.length === 0 ? (
        <View style={styles.center}>
          <Paragraph>No pending users.</Paragraph>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {pendingUsers.map(user => (
            <Card key={user.temp_user_id} style={styles.card} elevation={2}>
              <Card.Content>
                <Title>{user.name}</Title>
                <Paragraph>Email: {user.email}</Paragraph>
                <Paragraph>Organisation: {user.organisation}</Paragraph>
                <Button
                  mode="contained"
                  onPress={() => handleApprove(user.temp_user_id)}
                  style={styles.button}
                >
                  Approve
                </Button>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMsg}
      </Snackbar>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 12 },
  card:          { marginBottom: 12 },
  button:        { marginTop: 8 },
  error:         { color: 'red', textAlign: 'center' },
});
