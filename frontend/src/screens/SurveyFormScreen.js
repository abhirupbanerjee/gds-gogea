// src/screens/SurveyFormScreen.js
import {IMAGE_BASE_URL2 } from '@env';
import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Platform,
  Text,
  TouchableOpacity
} from 'react-native';
import {
  Surface,
  Card,
  TextInput,
  Button,
  Title,
  Paragraph,
  Snackbar
} from 'react-native-paper';
import DocumentPicker from './NativeDocumentPicker';
import { AuthContext } from '../contexts/AuthContext';


const ALLOWED_EXTENSIONS = ['zip', 'xlsx', 'xls', 'pdf', 'docx'];

// ─── Ministries list (truncated here for brevity) ───────────────────────────
const MINISTRIES = [
  "Office of the Prime Minister",
  "Ministry of Legal Affairs, Labour & Consumer Affairs",
  "Ministry of Tourism, the Creative Economy and Culture",
  "Ministry of Economic Development, Planning, Agriculture and Lands, Forestry, Marine Resources, and Cooperatives",
  "Ministry of Education, Youth & Sports",
  "Ministry of Health",
  "Minister for Infrastructure and Physical Development, Public Utilities, Civil Aviation and Transportation",
  "Ministry of National Security, Home Affairs, Public Administration, Information and Disaster Management",
  "Ministry of Foreign Affairs, Trade & Export Development",
  "Ministry of Social & Community Development, Housing and Gender Affairs",
  "Ministry of Mobilisation, Implementation & Transformation",
  "Ministry of Carriacou & Petite Martinique Affairs and Local Government",
  "Ministry of Climate Resilience, The Environment & Renewable Energy",
  "Ministry of Finance",
  "Government Information Service (GIS)",
  "Grenada Postal Corporation",
  "Citizenship by Investment Unit (CBIU)",
  "Labour Advisory Board",
  "Wages Advisory Committee",
  "Attorney General's Chambers",
  "Department of Labour",
  "Legal Aid and Counselling Clinic",
  "Grenada Tourism Authority (GTA)",
  "Grenada Development Bank",
  "Grenada Industrial Development Corporation",
  "Grenada Bureau of Standards",
  "Grenada Cocoa Association",
  "Grenada Cooperative Nutmeg Association",
  "Marketing and National Importing Board",
  "Grenada National Accreditation Board",
  "National Sports Council",
  "Grenada Food and Nutrition Council",
  "Grenada Ports Authority",
  "National Water and Sewerage Authority (NAWASA)",
  "Grenada Airport Authority",
  "Gravel, Concrete & Emulsion Production Corporation",
  "Public Utilities Regulatory Commission (PURC)",
  "NaDMA (National Disaster Management Agency)",
  "Royal Grenada Police Force",
  "Immigration and Passport Services",
  "Fire and Rescue Services",
  "Consular Services-Embassy of Grenada",
  "Child Protection Authority",
  "Housing Authority of Grenada",
  "Grenada Solid Waste Management Authority",
  "Environmental Health Division",
  "Inland Revenue Division",
  "Customs and Excise Division",
  "Government Printery",
  "Financial Intelligence Unit (FIU)"
];

export default function SurveyFormScreen({ route, navigation }) {
  const { survey } = route.params;
  const { token }  = useContext(AuthContext);

  const [serviceId, setServiceId]                   = useState(null);
  const [ministryName, setMinistryName]             = useState('');
  const [showSuggestions, setShowSuggestions]       = useState(false);
  const [representativeName, setRepresentativeName] = useState('');
  const [contactNumber, setContactNumber]           = useState('');
  const [email, setEmail]                           = useState('');
  const [requestReason, setRequestReason]           = useState('');
  const [notes, setNotes]                           = useState('');
  const [file, setFile]                             = useState(null);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg]         = useState('');

  /* ─────────────────── Lookup service_id once ──────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${IMAGE_BASE_URL2}/service-id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: survey.title })
        });
        if (!res.ok) throw new Error();
        const { service_id } = await res.json();
        setServiceId(service_id);
      } catch {
        setSnackbarMsg('Could not determine service. Try again later.');
        setSnackbarVisible(true);
      }
    })();
  }, [survey.title]);

  /* ─────────────────── File attach ──────────────────── */
  const handleAttach = async () => {
    try {
      const res = await DocumentPicker.pickSingle({ type: DocumentPicker.types.allFiles });
      const name = res.name || res.fileName;
      const ext  = name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) throw new Error();
      setFile(res);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        setSnackbarMsg('Failed to pick a file.');
        setSnackbarVisible(true);
      }
    }
  };

  /* ─────────────────── Submit ──────────────────── */
  const handleSubmit = async () => {
    const digits = contactNumber.replace(/\D/g, '');
    if (![7, 10, 11].includes(digits.length)) {
      setSnackbarMsg('Check the contact number.');
      setSnackbarVisible(true);
      return;
    }
    if (
      !serviceId ||
      !ministryName.trim() ||
      !representativeName.trim() ||
      !contactNumber.trim() ||
      !email.trim() ||
      !requestReason.trim() ||
      !file
    ) {
      setSnackbarMsg('Please complete all required fields and attach a file.');
      setSnackbarVisible(true);
      return;
    }

    const formData = new FormData();
    formData.append('service_id', serviceId);
    formData.append('reason', requestReason);
    formData.append('ministry_name', ministryName);
    formData.append('representative_name', representativeName);
    formData.append('representative_email', email);
    formData.append('contact_number', contactNumber);
    formData.append('notes', notes);
    formData.append('additional_info', notes);

    if (Platform.OS === 'web') {
      formData.append('file', file);
    } else {
      formData.append('file', {
        uri: file.uri,
        name: file.name || file.fileName,
        type: file.type || 'application/octet-stream'
      });
    }

    try {
      const resp = await fetch(`${IMAGE_BASE_URL2}/service-requests-with-file/`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData
      });
      const data = await resp.json();
      if (resp.ok) {
        setSnackbarMsg('Request submitted successfully.');
        setSnackbarVisible(true);
        setTimeout(() => navigation.goBack(), 3000);
      } else {
        setSnackbarMsg(data.detail || 'Submission failed.');
        setSnackbarVisible(true);
      }
    } catch {
      setSnackbarMsg('Could not submit request.');
      setSnackbarVisible(true);
    }
  };

  /* ─────────────────── Reset ──────────────────── */
  const handleReset = () => {
    setMinistryName('');
    setRepresentativeName('');
    setContactNumber('');
    setEmail('');
    setRequestReason('');
    setNotes('');
    setFile(null);
    setShowSuggestions(false);
  };

  /* ─────────────────── UI ──────────────────── */
  return (
    <Surface style={styles.surface}>
      <ScrollView contentContainerStyle={styles.container}>
        <Title style={styles.title}>{survey.title} Service Request</Title>
        <View style={styles.underline} />

        {/* Entity Details */}
        <Card style={styles.card} elevation={0}>
          <Card.Title title="Entity Details" titleStyle={styles.cardTitle} />
          <Card.Content>
            <View style={styles.row}>
              {/* Autocomplete wrapper with dynamic spacer margin */}
              <View
                style={[
                  styles.autocompleteWrapper,
                  showSuggestions && ministryName.length > 0 && styles.dropdownSpacer
                ]}
              >
                <TextInput
                  label="Ministry Name *"
                  placeholder="Type or select ministry"
                  value={ministryName}
                  onChangeText={text => {
                    setMinistryName(text);
                    setShowSuggestions(true);
                  }}
                  mode="outlined"
                  style={[styles.input, styles.halfInput]}
                />
                {showSuggestions && ministryName.length > 0 && (
                  <ScrollView style={styles.suggestionsContainer}>
                    {MINISTRIES.filter(m =>
                      m.toLowerCase().includes(ministryName.toLowerCase())
                    )
                      .slice(0, 10)
                      .map(m => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => {
                            setMinistryName(m);
                            setShowSuggestions(false);
                          }}
                          style={styles.suggestionItem}
                        >
                          <Text>{m}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                )}
              </View>

              <TextInput
                label="Representative Name *"
                placeholder="Enter representative name"
                value={representativeName}
                onChangeText={setRepresentativeName}
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>

            <View style={styles.row}>
              <TextInput
                label="Contact Number *"
                placeholder="Enter contact number"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
              <TextInput
                label="Email *"
                placeholder="Enter email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                mode="outlined"
                style={[styles.input, styles.halfInput]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Service Request */}
        <Card style={styles.card} elevation={0}>
          <Card.Title title="Service Request" titleStyle={styles.cardTitle} />
          <Card.Content>
            <TextInput
              label="Reason for Request *"
              placeholder="Describe your reason"
              value={requestReason}
              onChangeText={setRequestReason}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
            />
            <Button
              mode="outlined"
              icon="paperclip"
              onPress={handleAttach}
              uppercase={false}
              style={styles.attachmentButton}
            >
              {file ? file.name || file.fileName : 'Attach files (zip/pdf/xlsx)'}
            </Button>
          </Card.Content>
        </Card>

        {/* Notes */}
        <Card style={styles.card} elevation={0}>
          <Card.Title title="Notes" titleStyle={styles.cardTitle} />
          <Card.Content>
            <TextInput
              label="Other Information"
              placeholder="Any additional notes"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Additional Info */}
        <Card style={styles.card} elevation={0}>
          <Card.Title title="Additional Information" titleStyle={styles.cardTitle} />
          <Card.Content>
            <Paragraph style={styles.paragraph}>
              <Text style={styles.label}>Service fee:</Text> Not applicable
            </Paragraph>
            <Paragraph style={styles.paragraph}>
              <Text style={styles.label}>Delivery timelines:</Text> Refer service document
            </Paragraph>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.buttonRow}>
          <Button
            mode="text"
            icon="refresh"
            onPress={handleReset}
            style={styles.resetButton}
          >
            Reset
          </Button>
          <Button
            mode="contained"
            icon="check"
            onPress={handleSubmit}
            style={styles.submitButton}
          >
            Submit
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbarVisible(false) }}
      >
        {snackbarMsg}
      </Snackbar>
    </Surface>
  );
}

/* ──────────────── Styles ──────────────── */
const styles = StyleSheet.create({
  surface:  { flex: 1, backgroundColor: '#FFF' },
  container:{ padding: 20, backgroundColor: '#FFF' },
  title:    { fontSize: 24, fontWeight: '600', textAlign: 'center', color: '#1E293B' },
  underline:{ alignSelf: 'center', width: 140, height: 2, backgroundColor: '#1E293B', marginVertical: 16 },
  card:     { marginBottom: 20, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle:{ fontSize: 18, fontWeight: '500', color: '#1E293B' },
  row:      { flexDirection: 'row', justifyContent: 'space-between' },

  /* Autocomplete */
  autocompleteWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
    overflow: 'visible'
  },
  dropdownSpacer: {
    marginBottom: 130   /* pushes next inputs when list is open */
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6200ee',
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    maxHeight: 120,
    paddingRight: 20,
    zIndex: 1000,
    elevation: 5        /* Android shadow */
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12
  },

  /* Inputs */
  input:    { marginBottom: 12, backgroundColor: '#FFF' },
  halfInput:{ flex: 1, marginRight: 8 },
  textArea: { height: 100 },
  attachmentButton: { borderColor: '#1E293B', marginTop: 8 },

  /* Text */
  paragraph:{ marginBottom: 8, color: '#475569' },
  label:    { fontWeight: '600', color: '#334155' },

  /* Buttons */
  buttonRow:{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, marginBottom: 40 },
  resetButton:{ marginRight: 12 },
  submitButton:{ backgroundColor: '#0F1E40' }
});
