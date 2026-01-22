// src/components/FrameworkContent.js
import { API_BASE_URL, IMAGE_BASE_URL } from '@env';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Title, Paragraph, Divider } from 'react-native-paper';
import Footer from './Footer';

const { width } = Dimensions.get('window');
const STORAGE_KEY = '@FrameworkScreenSections';

export default function FrameworkContent() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cached sections
  const loadCached = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setSections(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load cached framework data', e);
    }
  };

  // Fetch live from Drupal
  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/drupal/pages`);
      const data = await res.json();
      const page = data.pages.find((p) => p.title === 'Framework');
      if (!page?.sections) return;

      // Fix image URL and keep everything else
      const fixed = page.sections.map((sec) =>
        sec.type === 'image'
          ? {
              ...sec,
              url: sec.url.replace(
                'http://drupal/',
                IMAGE_BASE_URL
              ),
            }
          : sec
      );

      setSections(fixed);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fixed));
    } catch (e) {
      console.error('Error fetching framework page:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCached().then(fetchContent);
  }, []);

  // Show spinner if first time and no cache
  if (loading && sections.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Helpers to split heading vs paragraph
  const splitSection = (text, splitter) => {
    const idx = text.indexOf(splitter);
    if (idx > 0) {
      return [text.slice(0, idx), text.slice(idx)];
    }
    return [text, ''];
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* --- Header + Overview Paras --- */}
      <Title style={styles.header}>{sections[0]?.content}</Title>
      {[1, 2, 3].map((i) => (
        <Paragraph key={i} style={styles.text}>
          {sections[i]?.content}
        </Paragraph>
      ))}

      {/* --- Image --- */}
      <View style={styles.imageWrapper}>
        {sections[4]?.url && (
          <Image
            source={{ uri: sections[4].url }}
            style={styles.image}
            resizeMode="contain"
          />
        )}
      </View>

      {/* --- Detailed Sections --- */}
      <Divider style={styles.divider} />

      {/* intro */}
      <Paragraph style={styles.text}>{sections[5]?.content}</Paragraph>

      {/* 1. Inputs to Grenada EA */}
      {(() => {
        const raw = sections[6]?.content || '';
        const [heading, para] = splitSection(raw, 'The framework');
        return (
          <React.Fragment key="sec6">
            <Title style={styles.sectionHeader}>{heading}</Title>
            <Paragraph style={styles.sectionText}>{para}</Paragraph>
          </React.Fragment>
        );
      })()}

      {/* 2. Enabling Digital Grenada */}
      {(() => {
        const raw = sections[7]?.content || '';
        // split at "The Focus Areas"
        const [heading, remainder] = splitSection(raw, 'The Focus Areas');
        // bullet parts:
        const bullets = (remainder.match(/(Build People:[^S]*?)(?=Simplify Life:)|Simplify Life:[^B]*?(?=Boost Resiliency)|Boost Resiliency and Sustainability:[\s\S]*$/g) || [])
          .map(b => b.trim());
        return (
          <React.Fragment key="sec7">
            <Title style={styles.sectionHeader}>{heading}</Title>
            <Paragraph style={styles.sectionText}>
              The Focus Areas{ remainder.replace(/^The Focus Areas:/, '') }
            </Paragraph>
            {bullets.map((b, idx) => (
              <Paragraph key={idx} style={styles.listItem}>
                <Paragraph style={styles.bold}>
                  {b.split(':')[0]}:
                </Paragraph>{' '}
                {b.split(':')[1]}
              </Paragraph>
            ))}
          </React.Fragment>
        );
      })()}

      {/* 3. Roadmap */}
      {(() => {
        const raw = sections[8]?.content || '';
        const [heading, para] = splitSection(raw, 'The roadmap');
        return (
          <React.Fragment key="sec8">
            <Title style={styles.sectionHeader}>{heading}</Title>
            <Paragraph style={styles.sectionText}>{para}</Paragraph>
          </React.Fragment>
        );
      })()}

      {/* 4. Architecture Domains */}
      {(() => {
        const raw = sections[9]?.content || '';
        const [heading, para] = splitSection(raw, 'Performance:');
        // domains with description after label:
        const domainPairs = para.split(/([A-Z][a-z]+:)/g).filter(Boolean);
        // e.g. ["Performance:", " Ensures...", "Interfaces:", " Focus...", ...]
        const domains = [];
        for (let i = 0; i < domainPairs.length; i += 2) {
          domains.push({
            label: domainPairs[i].replace(':',''),
            text: domainPairs[i+1].trim(),
          });
        }
        return (
          <React.Fragment key="sec9">
            <Title style={styles.sectionHeader}>{heading}</Title>
            <Paragraph style={styles.sectionText}>{para.split(':')[0]}</Paragraph>
            {domains.map((d, i) => (
              <Paragraph key={i} style={styles.listItem}>
                <Paragraph style={styles.bold}>{d.label}:</Paragraph> {d.text}
              </Paragraph>
            ))}
          </React.Fragment>
        );
      })()}

      {/* 5. GEA Core Components */}
      {(() => {
        const raw = sections[10]?.content || '';
        const [heading, para] = splitSection(raw, 'The Core Components');
        // similar split on each label:
        const parts = para.split(/([A-Z][a-z]+(?=\:))/g).filter(Boolean);
        // parts like ["", "Governance", ": Ensures...", "Principles...", ": Define...", ...]
        const comps = [];
        for (let i = 1; i < parts.length; i += 2) {
          const label = parts[i];
          const text = parts[i+1].replace(/^:\s*/, '').split('.').slice(0,-1).join('.').trim();
          comps.push({ label, text });
        }
        return (
          <React.Fragment key="sec10">
            <Title style={styles.sectionHeader}>{heading}</Title>
            <Paragraph style={styles.sectionText}>{para.split('.')[0]}</Paragraph>
            {comps.map((c, i) => (
              <Paragraph key={i} style={styles.listItem}>
                <Paragraph style={styles.bold}>{c.label}:</Paragraph> {c.text}
              </Paragraph>
            ))}
          </React.Fragment>
        );
      })()}

      {/* 6. Building Digital Capabilities */}
      {(() => {
        const raw = sections[11]?.content || '';
        // split at "Government Focus:"
        const parts = raw.split(/Government Focus:/);
        const rest = parts[1] || '';
        const [gov, industry] = rest.split(/Industry Focus:/).map(s => s.trim());
        return (
          <React.Fragment key="sec11">
            <Title style={styles.sectionHeader}>6. Building Digital Capabilities</Title>
            <Paragraph style={styles.sectionText}>
              <Paragraph style={styles.bold}>Government Focus:</Paragraph>{' '}
              {gov.replace(/^:/, '').trim()}
            </Paragraph>
            <Paragraph style={styles.sectionText}>
              <Paragraph style={styles.bold}>Industry Focus:</Paragraph>{' '}
              {industry.replace(/^:/, '').trim()}
            </Paragraph>
          </React.Fragment>
        );
      })()}
      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1E293B',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#334155',
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: width - 40,
    height: (width - 40) * 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
    color: '#1E293B',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    color: '#334155',
  },
  listItem: {
    marginLeft: 12,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#1E293B',
  },
});
