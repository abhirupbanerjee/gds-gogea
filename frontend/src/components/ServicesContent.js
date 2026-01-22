import { API_BASE_URL, IMAGE_BASE_URL} from '@env';
import React, { useContext, useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Surface,
  Card,
  Title,
  Paragraph,
  Button,
  Avatar,
  Snackbar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import AdminServicesContent from './AdminServicesContent'; // Admin-specific view
import Footer from './Footer';
const SECTIONS_KEY = '@ServicesPageSections';
const CARDS_KEY = '@ServicesServiceCards';

const ServicesContent = () => {
  const navigation = useNavigation();
  const { isLoggedIn, role } = useContext(AuthContext);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [pageSections, setPageSections] = useState([]);
  const [serviceCards, setServiceCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load cached data
  const loadCached = async () => {
    try {
      const cachedSections = await AsyncStorage.getItem(SECTIONS_KEY);
      const cachedCards = await AsyncStorage.getItem(CARDS_KEY);
      if (cachedSections) setPageSections(JSON.parse(cachedSections));
      if (cachedCards) setServiceCards(JSON.parse(cachedCards));
    } catch (e) {
      console.warn('Failed to load cached services data', e);
    }
  };

  // Fetch live data and cache
  const fetchContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/drupal/pages`);
      const data = await response.json();
      const servicesPage = data.pages.find(
        (page) => page.title === 'Services'
      );
      if (servicesPage?.sections) {
        const introSections = servicesPage.sections.slice(0, 2);
        const cardDataSections = servicesPage.sections.slice(2);
        const groupedCards = [];
        for (let i = 0; i < cardDataSections.length; i += 4) {
          const [titleSec, subSec, imgSec, descSec] = cardDataSections.slice(i, i + 4);
          if (titleSec && subSec && imgSec && descSec) {
            groupedCards.push({
              title: titleSec.content,
              subtitle: subSec.content,
              image: imgSec.url.replace(
                'http://drupal/drupal_t',
                IMAGE_BASE_URL
              ),
              description: descSec.content,
            });
          }
        }
        setPageSections(introSections);
        setServiceCards(groupedCards);
        await AsyncStorage.setItem(SECTIONS_KEY, JSON.stringify(introSections));
        await AsyncStorage.setItem(CARDS_KEY, JSON.stringify(groupedCards));
      }
    } catch (error) {
      console.error('Error fetching services data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCached().then(fetchContent);
  }, []);

  // Handle start press
  const handleStartPress = (card) => {
    if (!isLoggedIn) {
      setSnackbarVisible(true);
    } else {
      navigation.navigate('SurveyFormScreen', { survey: card });
    }
  };

  // Loading state
  if (loading && pageSections.length === 0 && serviceCards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Final render
  return (
    role === 'admin' ? (
      <AdminServicesContent />
    ) : (
      <Surface style={styles.surface}>
        <ScrollView contentContainerStyle={styles.container}>
          <Title style={styles.heading}>Services</Title>

          {pageSections.map((section, index) => {
            if (section.type === 'text') {
              return (
                <Paragraph key={index} style={styles.paragraph}>
                  {section.content}
                </Paragraph>
              );
            } else if (section.type === 'image') {
              const fixedUrl = section.url.replace(
                'http://drupal/drupal_t',
                IMAGE_BASE_URL
              );
              return (
                <Card key={index} style={styles.bannerCard}>
                  <Card.Cover source={{ uri: fixedUrl }} style={styles.image} />
                </Card>
              );
            }
            return null;
          })}

          <View style={styles.cardsContainer}>
            {serviceCards.map((cardData, index) => {
              const cardLetter = String.fromCharCode(65 + index);
              return (
                <Card key={index} style={styles.card}>
                  <Card.Title
                    title={cardData.title}
                    subtitle={cardData.subtitle}
                    left={(props) => (
                      <Avatar.Text
                        {...props}
                        label={cardLetter}
                        size={40}
                        style={styles.avatar}
                      />
                    )}
                    titleStyle={styles.cardTitle}
                    subtitleStyle={styles.cardSubtitle}
                  />
                  <Card.Cover
                    source={{ uri: cardData.image }}
                    style={styles.cardCover}
                  />
                  <View style={styles.cardBody}>
                    <Card.Content>
                      <Paragraph style={styles.description}>
                        {cardData.description}
                      </Paragraph>
                    </Card.Content>
                    <Card.Actions style={styles.cardActions}>
                      <Button
                        mode="contained"
                        onPress={() => handleStartPress(cardData)}
                      >
                        Start!
                      </Button>
                    </Card.Actions>
                  </View>
                </Card>
              );
            })}
          </View>
          <Footer />
        </ScrollView>

        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
        >
          Please login first to start the survey.
        </Snackbar>
      </Surface>
    )
  );
};

export default ServicesContent;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surface: {
    flex: 1,
  },
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  paragraph: {
    fontSize: 16,
    marginVertical: 8,
    lineHeight: 22,
  },
  bannerCard: {
    marginVertical: 16,
  },
  image: {
    height: 300,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  card: {
    width: '29%',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    flexDirection: 'column',
  },
  cardCover: {
    height: 170,
    backgroundColor: '#fff',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 8,
    minHeight: 150,
  },
  avatar: {
    backgroundColor: '#6200ee',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#555',
  },
  description: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#333',
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
});