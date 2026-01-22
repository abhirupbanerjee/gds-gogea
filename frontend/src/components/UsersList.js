// UsersList.js
import {IMAGE_BASE_URL2 } from '@env';
import React, { useContext, useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Surface, DataTable } from 'react-native-paper';
import { AuthContext } from '../contexts/AuthContext';
import { useIsFocused } from '@react-navigation/native';

const COL_TITLES = ['User ID', 'Name', 'Email', 'Organisation'];
const COL_WIDTH  = 220;
const TABLE_W    = COL_WIDTH * COL_TITLES.length;

export default function UsersList({ refreshFlag, onSelect }) {
  const { token } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${IMAGE_BASE_URL2}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.ok ? await res.json() : [];
        setUsers(data.filter(u => u.role === 'user'));
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isFocused, token, refreshFlag]);

  if (loading) {
    return (
      <Surface style={styles.centerBox}>
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  return (
    <Surface style={styles.container} elevation={4}>
      <Text style={styles.heading}>User Management</Text>

      {users.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ minWidth: '100%' }}
          contentContainerStyle={styles.scrollCC}
        >
          <View style={styles.tableHolder}>
            <DataTable style={{ width: TABLE_W }}>
              <DataTable.Header style={styles.headerRow}>
                {COL_TITLES.map(t => (
                  <DataTable.Title key={t} style={styles.column}>
                    <Text style={styles.colTitle}>{t}</Text>
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {users.map(u => (
                <DataTable.Row
                  key={u.user_id}
                  style={styles.dataRow}
                  onPress={() => onSelect(u.email)}
                >
                  {[u.user_id, u.name, u.email, u.organisation].map((v, i) => (
                    <DataTable.Cell key={i} style={styles.column}>
                      <Text style={styles.cellTxt}>{v}</Text>
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>No user-role accounts found.</Text>
        </View>
      )}
    </Surface>
  );
}

/* -------- styles -------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'transparent',  marginLeft: 'auto',
    marginRight: 'auto' },
  heading: { fontSize: 32, fontWeight: 'bold', marginVertical: 16, textAlign: 'center' },

  scrollCC: { paddingBottom: 20 },

  /* critical change: margin auto centres block on web */
  tableHolder: {
    width: TABLE_W,
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  headerRow: { backgroundColor: '#f5f5f5' },
  column: { width: COL_WIDTH, justifyContent: 'center' },
  colTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  dataRow: { backgroundColor: '#fff' },
  cellTxt: { fontSize: 18, textAlign: 'center', flexWrap: 'wrap' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, color: '#777', textAlign: 'center' },
});
