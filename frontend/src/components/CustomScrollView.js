// src/components/CustomScrollView.js
import React from 'react';
import { Platform, ScrollView, View } from 'react-native';

const CustomScrollView = (props) => {
  // On web, use a View with overflow:auto and explicitly set height.
  if (Platform.OS === 'web') {
    return (
      <View style={[{ flex: 1, overflow: 'auto', height: '100%' }, props.style]}>
        <View style={props.contentContainerStyle}>
          {props.children}
        </View>
      </View>
    );
  }
  // On mobile, use the native ScrollView.
  return <ScrollView {...props}>{props.children}</ScrollView>;
};

export default CustomScrollView;
