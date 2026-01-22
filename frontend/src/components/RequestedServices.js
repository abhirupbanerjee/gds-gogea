// src/components/RequestedServices.js
import { IMAGE_BASE_URL2 } from '@env';
import React, { useEffect, useState, useContext } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  ActivityIndicator,
  Snackbar,
  DataTable,
  IconButton
} from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../contexts/AuthContext';

const STATUSES = ['Draft', 'Submitted', 'Active', 'Completed'];

export default function RequestedServices() {
  const { token, role } = useContext(AuthContext);

  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [selectedEmail, setEmail] = useState('');
  const [snMsg, setSnMsg]         = useState('');

  /* fetch */
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${IMAGE_BASE_URL2}/all-service-requests1`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then(setRequests)
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [token]);

  /* helpers */
  const emails = [...new Set(requests.map(r => r.email))];
  const rows   = requests.filter(r => !selectedEmail || r.email === selectedEmail);

  const updateStatus = (id, status) => {
    fetch(`${IMAGE_BASE_URL2}/service-request_update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        setRequests(rs => rs.map(q => (q.request_id === id ? { ...q, status } : q)));
        setSnMsg('Status updated');
      })
      .catch(e => setSnMsg('Update failed: ' + e.message));
  };

  /* guards */
  if (!token || role !== 'admin')
    return (
      <Surface style={styles.center}>
        <Text>You must be an admin to view this.</Text>
      </Surface>
    );
  if (loading)
    return (
      <Surface style={styles.center}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  if (error)
    return (
      <Surface style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </Surface>
    );

  /* render */
  return (
    <Surface style={styles.container}>
      {/* email filter */}
      <View style={styles.filterRow}>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={selectedEmail} onValueChange={setEmail} mode="dropdown">
            <Picker.Item label="All users" value="" />
            {emails.map(e => (
              <Picker.Item key={e} label={e} value={e} />
            ))}
          </Picker>
        </View>
      </View>

      {rows.length === 0 ? (
        <View style={styles.center}>
          <Text>No requests found.</Text>
        </View>
      ) : (
        <ScrollView horizontal contentContainerStyle={styles.scrollWrap}>
          <Surface style={styles.tableCard} elevation={2}>
            <DataTable>
              <DataTable.Header style={styles.headerRow}>
                <DataTable.Title style={styles.colService}>Service</DataTable.Title>
                <DataTable.Title style={styles.colEmail}>Email</DataTable.Title>
                <DataTable.Title style={styles.colId}>Request ID</DataTable.Title>
                <DataTable.Title style={styles.colStatus}>Status</DataTable.Title>
                <DataTable.Title style={styles.colAct}>Info</DataTable.Title>
              </DataTable.Header>

              {rows.map((r, idx) => (
                <DataTable.Row
                  key={r.request_id}
                  style={idx % 2 ? styles.altRow : null}
                >
                  <DataTable.Cell style={styles.colService}>{r.service_name}</DataTable.Cell>
                  <DataTable.Cell style={styles.colEmail}>{r.email}</DataTable.Cell>
                  <DataTable.Cell style={styles.colId}>{r.request_id}</DataTable.Cell>

                  <DataTable.Cell style={styles.colStatus}>
                    <Picker
                      selectedValue={r.status}
                      onValueChange={v => updateStatus(r.request_id, v)}
                      style={styles.inlinePicker}
                    >
                      {STATUSES.map(s => (
                        <Picker.Item key={s} label={s} value={s} />
                      ))}
                    </Picker>
                  </DataTable.Cell>

                  <DataTable.Cell style={styles.colAct}>
                    <IconButton
                      icon="information-outline"
                      size={18}
                      onPress={() =>
                        setSnMsg(
                          `Rep: ${r.representative_name}\nReason: ${r.reason}`
                        )
                      }
                    />
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>
        </ScrollView>
      )}

      <Snackbar
        visible={!!snMsg}
        onDismiss={() => setSnMsg('')}
        duration={2500}
      >
        {snMsg}
      </Snackbar>
    </Surface>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error:     { color: 'red', textAlign: 'center' },

  /* filter */
  filterRow:     { alignItems: 'center', marginTop: 8, marginBottom: 4 },
  pickerWrapper: {
    width: 280,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4
  },

  /* table wrapper */
  scrollWrap: { paddingVertical: 12, paddingHorizontal: 8 },
  tableCard:  {
    alignSelf: 'center',
    borderRadius: 6,
    overflow: 'hidden',
    minWidth: 900,
    backgroundColor: '#fafafa'
  },

  /* columns */
  colService: { minWidth: 150 },
  colEmail:   { minWidth: 180 },
  colId:      { minWidth: 200 },
  colStatus:  { minWidth: 120 },
  colAct:     { minWidth: 70, justifyContent: 'center' },

  /* header + rows */
  headerRow: { backgroundColor: '#f1f3f8' },
  altRow:    { backgroundColor: '#f9f9f9' },

  inlinePicker: { height: 32 }
});
