// Footer.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Surface } from 'react-native-paper';

const Footer = () => {
  const openUrl = (url) =>
    Linking.openURL(url).catch((err) => console.error('Failed to open URL:', err));

  return (
    <Surface style={styles.footer}>
      {/* Top row: Logo block on left, links on right */}
      <View style={styles.topRow}>
        {/* Left: Portal Title/Sub + Logo Row */}
        <View style={styles.leftSection}>
          {/* Portal Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.portalTitle}>Government of Grenada</Text>
            <Text style={styles.portalSubtitle}>EA Portal</Text>
          </View>

          {/* Flag + “Government of Grenada” label */}
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/grenada-flag.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Government of Grenada</Text>
          </View>
        </View>

        {/* Right: Quick Links & General information */}
        <View style={styles.linksGroup}>
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Quick Links</Text>
            <TouchableOpacity onPress={() => openUrl('https://www.gov.gd/')}>
              <Text style={styles.link}>GoG</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openUrl('https://my.gov.gd/')}>
              <Text style={styles.link}>eServices</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() =>
              openUrl('https://www.gov.gd/government/the-constitution')
            }>
              <Text style={styles.link}>Constitution</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.column}>
            <Text style={styles.columnTitle}>General information</Text>
            <TouchableOpacity onPress={() => openUrl('https://www.gov.gd/grenada')}>
              <Text style={styles.link}>About Grenada</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openUrl('https://www.gov.gd/fast-facts')}>
              <Text style={styles.link}>Facts</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() =>
              openUrl('https://www.gov.gd/emergency-services')
            }>
              <Text style={styles.link}>Emergency services</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Bottom bar: Copyright */}
      <View style={styles.bottomRow}>
        <Text style={styles.copyright}>
          © 2025 Government of Grenada. All rights reserved.
        </Text>
      </View>
    </Surface>
  );
};

export default Footer;

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    backgroundColor: '#014E72',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },

  // Left block
  leftSection: {
    flex: 1,
    maxWidth: 250,
  },
  titleSection: {
    marginBottom: 12,
  },
  portalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  portalSubtitle: {
    color: '#fff',
    fontSize: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 30,
  },
  logoText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },

  // Right block
  linksGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flex: 1,
  },
  column: {
    marginLeft: 40,
  },
  columnTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  link: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 6,
    textDecorationLine: 'underline',
  },

  // Bottom bar
  bottomRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#013f5a',
  },
  copyright: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});
