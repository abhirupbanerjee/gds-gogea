// src/screens/VisionScreen.js
import { API_BASE_URL, IMAGE_BASE_URL } from '@env';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Surface } from 'react-native-paper';
import Footer from '../components/Footer';

const STORAGE_KEY = '@VisionScreenItems';

const VisionScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCached = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        setItems(JSON.parse(json));
      }
    } catch (e) {
      console.warn('Failed to load cached Vision items', e);
    }
  };

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/drupal/pages`);
      const data = await res.json();
      const page = data.pages.find(p => p.title === 'Vision & Strategy');
      if (!page?.sections) return;

      const transformed = [];
      transformed.push({ type: 'heading', text: 'National Vision' });

      page.sections.forEach(section => {
        if (section.type === 'image') {
          transformed.push({
            type: 'image',
            url: section.url.replace(
              "http://drupal/drupal_t", IMAGE_BASE_URL),
          });
        } else if (section.type === 'text') {
          const txt = section.content.trim();
          if (['Digital Vision', 'EA Vision'].includes(txt)) {
            transformed.push({ type: 'heading', text: txt });
          } else if (txt.startsWith('”Grenada') && txt.includes('- National')) {
            const citStart = txt.indexOf('- National');
            const headingStart = txt.lastIndexOf('Digital Vision');
            const quote = txt.slice(0, citStart).trim();
            const citation = txt.slice(citStart, headingStart).trim();
            transformed.push({ type: 'paragraph', text: quote });
            transformed.push({ type: 'caption', text: citation });
          } else if (txt.startsWith('Digital Grenada')) {
            const subIdx = txt.indexOf('Our vision');
            const sub = subIdx > 0 ? txt.slice(0, subIdx).trim() : txt;
            const body = subIdx > 0 ? txt.slice(subIdx) : '';
            transformed.push({ type: 'subheading', text: sub });
            if (body) {
              body.split(/(?<=[.])(?=[A-Z])/).forEach(sent => {
                const t = sent.trim();
                if (t) transformed.push({ type: 'paragraph', text: t });
              });
            }
          } else if (txt.startsWith('”To enable')) {
            transformed.push({ type: 'paragraph', text: txt });
          }
        }
      });

      setItems(transformed);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transformed));
    } catch (e) {
      console.error('Error loading Vision & Strategy:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCached().then(fetchContent);
  }, []);

  const handleGoHome = () => navigation.navigate('Home');

  if (loading && items.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Surface style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoHome} style={styles.btn}>
          <Text style={styles.btnText}>Home</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {items.map((item, idx) => {
          switch (item.type) {
            case 'image':
              return (
                <Image
                  key={idx}
                  source={{ uri: item.url }}
                  style={styles.image}
                />
              );
            case 'heading':
              return (
                <Text key={idx} style={styles.heading}>
                  {item.text}
                </Text>
              );
            case 'subheading':
              return (
                <Text key={idx} style={styles.subheading}>
                  {item.text}
                </Text>
              );
            case 'paragraph':
              return (
                <Text key={idx} style={styles.paragraph}>
                  {item.text}
                </Text>
              );
            case 'caption':
              return (
                <Text key={idx} style={styles.caption}>
                  {item.text}
                </Text>
              );
            default:
              return null;
          }
        })}
        <Footer />
      </ScrollView>
    </Surface>
  );
};

export default VisionScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
  },
  btn: { padding: 6 },
  btnText: { color: '#007AFF', fontSize: 16 },
  content: { padding: 20 },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 12,
  },
});
