import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import Footer from './Footer';

const MaturityModelContent = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>EA Maturity Model</Text>

      <Text style={styles.description}>
        Welcome to the Maturity Assessment page tailored specifically for the Government of Grenada and its various Ministries and Agencies. Here, we explain the three essential levels of maturity—Digital Readiness, Architecture Maturity, and Domain-Specific Maturity—that can significantly enhance your organization's enterprise architecture capabilities.
      </Text>

      <Text style={styles.description}>
        By understanding these levels, your agency can chart a clear pathway for growth and improvement, effectively leveraging technology to optimize processes and service delivery. Our interactive dynamic progress bar and checklist enable users to self-assess their agency's maturity, providing valuable insights into current capabilities and areas for development. Upon completion, you will receive a comprehensive downloadable report based on your input, empowering you to make informed decisions on your journey towards greater maturity and success in serving the people of Grenada.
      </Text>

      <Image
        source={require('../../assets/ea_maturity_model.png')}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Level 1: Digital Readiness */}
      <Text style={styles.subheading}>Level 1: Digital Readiness</Text>
      <Text style={styles.description}>
        eGovernment Maturity Model is primarily intended to be used by the senior leadership to gauge the effect of digital transformation in Grenada at a holistic level. This model caters to the specific government digital priorities, focus areas and strategic initiatives established in the digital strategy.
      </Text>
      <Text style={styles.description}>
        The model presents the eGovernment maturity in five tiers:
      </Text>
      <Text style={styles.bullet}>1. <Text style={styles.bold}>Basic:</Text> Foundational elements (infrastructure, digital skills) are lacking. Basic websites exist but are not effective.</Text>
      <Text style={styles.bullet}>2. <Text style={styles.bold}>Opportunistic:</Text> Some advancements in digital areas exist, but lack coordinated strategy and asset reuse.</Text>
      <Text style={styles.bullet}>3. <Text style={styles.bold}>Systematic:</Text> Key areas of digital transformation are being developed in a structured way. Digital blueprint exists but has limited implementation.</Text>
      <Text style={styles.bullet}>4. <Text style={styles.bold}>Differentiating:</Text> Clear digital strengths with reusable assets and standards adopted across government.</Text>
      <Text style={styles.bullet}>5. <Text style={styles.bold}>Transformational:</Text> Advanced national strategy in place with strong citizen service transformation and innovation.</Text>

      {/* Level 2: Architecture Maturity */}
      <Text style={styles.subheading}>Level 2: Architecture Maturity</Text>
      <Text style={styles.description}>
        The Architecture Maturity Model is intended to enhance the capability of organizations to drive digital transformation. This model is inspired by the Architecture Capability Maturity Model (ACMM) by the US Department of Commerce.
      </Text>
      <Text style={styles.description}>
        It assesses enterprise architecture maturity in five levels:
      </Text>
      <Text style={styles.bullet}>1. <Text style={styles.bold}>Initial:</Text> Informal or no EA practices exist within the enterprise.</Text>
      <Text style={styles.bullet}>2. <Text style={styles.bold}>Under development:</Text> EA process is being defined or partially implemented.</Text>
      <Text style={styles.bullet}>3. <Text style={styles.bold}>Defined:</Text> EA framework is defined and adopted, but capability still evolving.</Text>
      <Text style={styles.bullet}>4. <Text style={styles.bold}>Managed:</Text> EA processes are measured and governed by an Architecture Board.</Text>
      <Text style={styles.bullet}>5. <Text style={styles.bold}>Measured:</Text> Metrics and analytics are in place for continuous improvement.</Text>

      {/* Level 3: Domain-Specific Maturity */}
      <Text style={styles.subheading}>Level 3: Domain-Specific Maturity</Text>
      <Text style={styles.description}>
        The Architecture Compliance Model serves as a foundational set of guidelines and requirements designed to assess the compliance levels of digital transformation initiatives and their alignment with best practices within specific domains and the target operating model.
      </Text>
      <Text style={styles.description}>
        The Government of Grenada collaborates with multiple vendors and partners, necessitating a comprehensive review of compliance with architecture standards and requirement specifications. The current compliance model connects architecture domains to the IT operating model across various phases, including strategy, design, delivery, and management. Level 2 of this model is inspired by COBIT and ITIL practices, supporting project teams in managing the software development process.
      </Text>
      <Text style={styles.description}>
        A well-architected initiative demands proactive management and engagement from both the project team and senior leadership to ensure that the solution aligns with business requirements and adequately addresses user stories. This model will undergo further review once the standards for each architecture domain have been established and will require alignment with the standards information base, as outlined in the enterprise content metamodel.
      </Text>
      <Footer />
    </ScrollView>
  );
};

export default MaturityModelContent;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subheading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#000',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
    color: '#333',
  },
  bullet: {
    fontSize: 15,
    marginBottom: 8,
    paddingLeft: 10,
    color: '#333',
  },
  bold: {
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 450,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 20,
  },
});
