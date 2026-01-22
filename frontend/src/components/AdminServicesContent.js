// src/components/AdminServicesContent.js
import * as React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';

import UsersList        from './UsersList';
import AddUsers         from './AddUsers';
import AddServices      from './AddServices';
import RequestedServices from './RequestedServices';
import UserApproval     from './UserApproval';

export default function AdminServicesContent() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);
  const [usersRefreshFlag, setUsersRefreshFlag] = React.useState(0);
  const [selectedEmail, setSelectedEmail] = React.useState(null);

  const routes = React.useMemo(
    () => [
      { key: 'users',     title: 'Users List' },
      { key: 'addUsers',  title: 'Add Users' },
      { key: 'add',       title: 'Add Services' },
      { key: 'requested', title: 'Requested Services' },
      { key: 'approval',  title: 'User Approval' }
    ],
    []
  );

  /* bump refresh when returning to Users tab */
  const handleIndexChange = newIndex => {
    setIndex(newIndex);
    if (routes[newIndex].key === 'users') {
      setUsersRefreshFlag(f => f + 1);
    }
  };

  /* when user row is clicked show Requested tab */
  const handleUserSelect = email => {
    setSelectedEmail(email);
    const reqIdx = routes.findIndex(r => r.key === 'requested');
    setIndex(reqIdx);
  };

  /* scenes */
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'users':
        return (
          <UsersList
            refreshFlag={usersRefreshFlag}
            onSelect={handleUserSelect}
          />
        );

      case 'addUsers':
        return <AddUsers />;

      case 'add':
        return <AddServices />;

      case 'requested':
        /* 👉  centered wrapper */
        return (
          <View style={styles.centerWrapper}>
            <RequestedServices email={selectedEmail} />
          </View>
        );

      case 'approval':
        return <UserApproval />;

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={handleIndexChange}
        initialLayout={{ width: layout.width }}
        renderTabBar={props => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.indicator}
            labelStyle={styles.label}
            tabStyle={styles.tabStyle}
          />
        )}
      />
    </View>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* tab bar */
  tabBar: {
    backgroundColor: '#fff',
    elevation: 2,
    justifyContent: 'center'
  },
  indicator: { backgroundColor: '#6200ee', height: 3 },
  label:     { color: '#000', fontWeight: '600', textTransform: 'none' },
  tabStyle:  { width: 'auto', paddingHorizontal: 16 },

  /* wrapper to center RequestedServices table */
  centerWrapper: {
    flex: 1,
    alignItems: 'center',   // horizontal centering
    justifyContent: 'flex-start'
  }
});
