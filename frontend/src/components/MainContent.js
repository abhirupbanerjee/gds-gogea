// src/components/MainContent.js
import { API_BASE_URL, IMAGE_BASE_URL } from '@env';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Platform,                   // ← NEW
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Surface } from 'react-native-paper';
import Footer from './Footer';

const STORAGE_KEY = '@MainContentData';
const { height: windowHeight } = Dimensions.get('window');

const MainContent = ({ navigation }) => {
  const [heroDescription, setHeroDescription] = useState('');
  const [bannerImageUrl, setHeroImageUrl] = useState('');
  const [focusAreaCards, setFocusAreaCards] = useState([]);
  const [visionTexts, setVisionTexts] = useState([]);
  const [visionImageUrl, setVisionImageUrl] = useState('');
  const [eaNewsCards, setEaNewsCards] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ───── existing cache + fetch logic ───────────────────── */
  const loadCached = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const {
          heroDescription,
          bannerImageUrl,
          focusAreaCards,
          visionTexts,
          visionImageUrl,
          eaNewsCards,
        } = JSON.parse(json);
        setHeroDescription(heroDescription);
        setHeroImageUrl(bannerImageUrl);
        setFocusAreaCards(focusAreaCards);
        setVisionTexts(visionTexts);
        setVisionImageUrl(visionImageUrl);
        setEaNewsCards(eaNewsCards);
      }
    } catch (e) {
      console.warn('Failed to load cached MainContent', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchContent = async () => {
    try {
      //const res = await fetch('http://localhost:8000/drupal/pages');
      const res = await fetch(`${API_BASE_URL}/drupal/pages`);
      const data = await res.json();
      if (!data.pages?.length) return;
      const sections = data.pages[0].sections;

      /* … unchanged parsing logic for hero, banner, cards, etc … */

      // HERO
      const heroBlock = sections.find(
        (s) =>
          s.type === 'text' &&
          !s.content.includes('Strategic Focus Areas') &&
          !s.content.includes('Vision & Strategy') &&
          !s.content.includes('EA News and Updates')
      );
      const hd = heroBlock?.content || '';

      // BANNER
      const bannerBlock = sections.find(
        (s) => s.type === 'image' && s.alt?.toLowerCase() === 'grenada port'
      );
      const biu = bannerBlock
        //? bannerBlock.url.replace('http://drupal/drupal_t', 'http://localhost:8001')
        ? bannerBlock.url.replace('http://drupal/drupal_t', IMAGE_BASE_URL)
        : '';

      // FOCUS AREA CARDS
      const titles = [
        'Build Our People',
        'Simplify Life',
        'Boost Resilience & Sustainability',
      ];
      const stratIdx = sections.findIndex((s) =>
        s.type === 'text' && s.content.includes('Strategic Focus Areas')
      );
      const visionIdx = sections.findIndex((s) =>
        s.type === 'text' && s.content.includes('Vision & Strategy')
      );
      const cards = [];
      if (stratIdx !== -1) {
        const sliceEnd = visionIdx > stratIdx ? visionIdx : sections.length;
        const blocks = sections.slice(stratIdx + 1, sliceEnd);
        for (let i = 0; i < blocks.length; i += 2) {
          const img = blocks[i];
          const txt = blocks[i + 1];
          if (img?.type === 'image' && txt?.type === 'text') {
            cards.push({
              //imageUrl: img.url.replace('http://drupal/drupal_t', 'http://localhost:8001'),
              imageUrl: img.url.replace('http://drupal/drupal_t', IMAGE_BASE_URL),
              cardTitle: titles[cards.length] || '',
              description: txt.content,
            });
          }
        }
      }

      // VISION
      const vIdx = sections.findIndex(
        (s) => s.type === 'text' && s.content === 'Vision & Strategy'
      );
      let vTexts = [];
      let viu = '';
      if (vIdx !== -1) {
        vTexts = [
          sections[vIdx + 1]?.type === 'text' ? sections[vIdx + 1].content : '',
          sections[vIdx + 2]?.type === 'text' ? sections[vIdx + 2].content : '',
        ];
        const vi = sections[vIdx + 3];
        if (vi?.type === 'image') {
          //viu = vi.url.replace('http://drupal/drupal_t', 'http://localhost:8001');
          viu = vi.url.replace('http://drupal/drupal_t', IMAGE_BASE_URL);
        }
      }

      // NEWS
      const newsIdx = sections.findIndex(
        (s) => s.type === 'text' && s.content === 'EA News and Updates'
      );
      const newsCards = [];
      if (newsIdx !== -1) {
        const news = sections.slice(newsIdx + 1);
        for (let i = 0; i < news.length; i += 2) {
          const img = news[i];
          const txt = news[i + 1];
          if (img?.type === 'image' && txt?.type === 'text') {
            newsCards.push({
              imageUrl: img.url.replace('http://drupal/drupal_t', IMAGE_BASE_URL),
              cardTitle: img.alt || '',
              description: txt.content,
            });
          }
        }
      }

      setHeroDescription(hd);
      setHeroImageUrl(biu);
      setFocusAreaCards(cards);
      setVisionTexts(vTexts);
      setVisionImageUrl(viu);
      setEaNewsCards(newsCards);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          heroDescription: hd,
          bannerImageUrl: biu,
          focusAreaCards: cards,
          visionTexts: vTexts,
          visionImageUrl: viu,
          eaNewsCards: newsCards,
        })
      );
    } catch (e) {
      console.error('Error fetching MainContent', e);
    }
  };

  useEffect(() => {
    loadCached().then(fetchContent);
  }, []);

  /* ───── floating chat-bot (web only) ────────────────────── */
  useEffect(() => {
    if (Platform.OS !== 'web') return;      // skip for Android / iOS builds

    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      #gea-chatbot-bubble{
        position:fixed;bottom:32px;right:32px;z-index:9999;background:#2563eb;color:#fff;
        border-radius:50%;width:64px;height:64px;box-shadow:0 4px 16px rgba(0,0,0,.2);
        display:flex;align-items:center;justify-content:center;font-size:2rem;cursor:pointer;
        transition:background .2s;
      }
      #gea-chatbot-bubble:hover{background:#1d4ed8}
      #gea-chatbot-iframe-container{
        display:none;position:fixed;bottom:110px;right:32px;z-index:10000;width:400px;height:600px;
        max-height:calc(100vh - 200px);box-shadow:0 8px 32px rgba(0,0,0,.25);
        border-radius:16px;overflow:hidden;background:#fff;
      }
      #gea-chatbot-iframe-container.open{display:block}
      #gea-chatbot-close{
        position:absolute;top:8px;right:12px;background:transparent;border:none;font-size:1.5rem;
        color:#333;cursor:pointer;z-index:1;
      }`;
    document.head.appendChild(styleEl);

    const bubble    = document.createElement('div');
    const container = document.createElement('div');
    const closeBtn  = document.createElement('button');
    const iframe    = document.createElement('iframe');

    bubble.id          = 'gea-chatbot-bubble';
    bubble.title       = 'GEA AI Assistant!';
    bubble.textContent = '💬';

    container.id       = 'gea-chatbot-iframe-container';

    closeBtn.id        = 'gea-chatbot-close';
    closeBtn.title     = 'Close';
    closeBtn.innerHTML = '&times;';

    iframe.src            = 'https://gea-ai-assistant.vercel.app/';
    iframe.style.border   = '0';
    iframe.allow          = 'clipboard-write';
    iframe.width          = '100%';
    iframe.height         = '100%';

    container.appendChild(closeBtn);
    container.appendChild(iframe);
    document.body.appendChild(bubble);
    document.body.appendChild(container);

    bubble.onclick   = () => container.classList.add('open');
    closeBtn.onclick = () => container.classList.remove('open');

    return () => {
      document.head.removeChild(styleEl);
      bubble.remove();
      container.remove();
    };
  }, []);
  /* ───────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { height: windowHeight }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView>
      <Surface style={styles.container}>
        {/* HERO */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Enterprise Architecture Portal</Text>
          <Text style={styles.heroDescription}>
            {/* Original text kept inline for demo */}
            The Enterprise Architecture (EA) portal in Grenada is designed as a centralized platform to support the digital transformation initiatives of the government. It provides an accessible resource for Ministries, Departments, and Agencies (MDAs) by disseminating digital architecture information and standardizing system architecture designs across government entities. The portal aims to accommodate the natural evolution of architecture frameworks and foster a collaborative environment for managing shared infrastructure and interoperable solutions. This approach ensures the alignment of digital initiatives with national priorities, facilitating seamless service delivery and governance efficiency.
          </Text>
          {/* <Text style={styles.heroDescription}>{heroDescription}</Text> */}
          {bannerImageUrl ? (
            <Image source={{ uri: bannerImageUrl }} style={styles.bannerImage} />
          ) : (
            <Text>Error loading banner image</Text>
          )}
        </View>

        {/* … rest of component unchanged … */}
        <View style={styles.additionalContent}>
          {/* Strategic Focus Areas */}
          <Text style={styles.sectionTitle}>Strategic Focus Areas</Text>
          <View style={styles.cardContainer}>
            {focusAreaCards.map((c, i) => (
              <View key={i} style={styles.card}>
                <Image source={{ uri: c.imageUrl }} style={styles.cardImage} />
                <Text style={styles.cardTitle}>{c.cardTitle}</Text>
                <Text style={styles.cardText}>{c.description}</Text>
              </View>
            ))}
          </View>

          {/* Vision & Strategy */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('VisionScreen', { visionTexts, visionImageUrl })
            }
          >
            <Text style={styles.sectionTitle}>Vision & Strategy</Text>
          </TouchableOpacity>
          <View style={styles.visionContainer}>
            <View style={styles.visionText}>
              {visionTexts.map((t, i) => (
                <Text key={i} style={styles.visionDescription}>
                  {t}
                </Text>
              ))}
            </View>
            {visionImageUrl ? (
              <Image source={{ uri: visionImageUrl }} style={styles.visionImage} />
            ) : (
              <Text>Error loading vision image</Text>
            )}
          </View>

          {/* EA News & Updates */}
          <Text style={styles.sectionTitle}>EA News and Updates</Text>
          <View style={styles.cardContainer}>
            {eaNewsCards.map((c, i) => (
              <View key={i} style={styles.card}>
                <Image source={{ uri: c.imageUrl }} style={styles.newsIcon} resizeMode="contain" />
                <Text style={styles.cardTitle}>{c.cardTitle}</Text>
                <Text style={styles.cardText}>{c.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </Surface>
      <Footer />
    </ScrollView>
  );
};

export default MainContent;

/* ───── styles ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  loadingContainer: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flexGrow: 1, backgroundColor: '#fff', padding: 30 },
  heroSection: { alignItems: 'flex-start', marginBottom: 50 },
  heroTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  heroDescription: { fontSize: 14, color: '#666', marginBottom: 20 },
  bannerImage: { width: '100%', height: 400, resizeMode: 'cover', marginTop: 20 },
  additionalContent: { padding: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  cardContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '30%', padding: 10, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  cardImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  cardText: { fontSize: 12, textAlign: 'center', color: '#666' },
  visionContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 20 },
  visionText: { width: '60%' },
  visionDescription: { fontSize: 14, color: '#666', marginBottom: 10 },
  visionImage: { width: '35%', height: 200, borderRadius: 10 },
  newsIcon: { width: 150, height: 150, alignSelf: 'center' },
});
