// NativeDocumentPicker.js
import { Platform } from 'react-native';

let DocumentPicker;

if (Platform.OS === 'web') {
  // on web, emulate a file-input
  DocumentPicker = {
    types: {
      allFiles: '*/*',
    },
    pickSingle: async ({ type }) =>
      new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type;
        input.onchange = () => {
          const file = input.files[0];
          if (file) resolve(file);
          else reject(new Error('No file selected'));
        };
        input.click();
      }),
    isCancel: () => false,
  };
} else {
  // on iOS/Android, use the native module
  DocumentPicker = require('react-native-document-picker').default;
}

export default DocumentPicker;
