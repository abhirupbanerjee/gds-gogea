import { API_BASE_URL } from '@env';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  Linking,
  Dimensions,
  Image
} from 'react-native';
import {
  Surface,
  Button,
  TextInput,
  ActivityIndicator
} from 'react-native-paper';

// Import JSON data
import tagsData from '../jsons/tags.json';
import filtersData from '../jsons/filters.json';

const windowWidth = Dimensions.get('window').width;
const dialogSize = windowWidth * 0.36;

// Use the imported JSON data:
const tags = tagsData;
const filterOptionsWithValues = filtersData.filterOptionsWithValues;
const filterMapping = filtersData.filterMapping;

const ITEMS_PER_PAGE = 4;

const RepositoryContent = ({ selectedCategory, onCategoryPress }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  
  // openDetailId tracks the file id whose detail section is open.
  const [openDetailId, setOpenDetailId] = useState(null);
  // selectedFileDescription now holds the metadata object fetched from /file-metadata/
  const [selectedFileDescription, setSelectedFileDescription] = useState('');
  const [descLoading, setDescLoading] = useState(false);
  
  // selectedTag holds the currently selected tag (only one allowed)
  const [selectedTag, setSelectedTag] = useState(null);

  // Helper function to fetch description (used for file cards)
  const fetchDescription = async (filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/files/descriptions?filename=${encodeURIComponent(filename)}`);
      const result = await response.json();
      return result["Brief Description"] ? result["Brief Description"] : "No description available";
    } catch (err) {
      return "Error fetching description";
    }
  };

  useEffect(() => {
    fetchDefaultFiles();
  }, []);

  const fetchDefaultFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/list-files`);
      const fileNames = await response.json();
      const processed = await Promise.all(
        fileNames.map(async (filename, i) => {
          const type = filename.split('.').pop().toUpperCase();
          const description = await fetchDescription(filename);
          return {
            id: i.toString(),
            fileName: filename,
            title: filename.replace(/\.[^/.]+$/, ''),
            category: type,
            description: description,
            categoryType: 'digitalGrenada',
            date: new Date().toLocaleDateString(),
          };
        })
      );
      setFiles(processed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch files based on tag using the combined-search endpoint.
  const fetchByTag = async (tag) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/combined-search/?title=${encodeURIComponent(tag)}`
      );
      const result = await response.json();

      const elasticResults = result.elasticsearch_results || [];
      const minioResults = Array.isArray(result.minio_results) ? result.minio_results : [];
      // Combine results from both sources.
      const combinedResults = [
        ...elasticResults.map(filename => {
          const type = filename.split('.').pop().toUpperCase();
          return {
            fileName: filename,
            title: filename.replace(/\.[^/.]+$/, ''),
            category: type,
            description: 'Dummy', // placeholder; will be replaced
            categoryType: 'digitalGrenada',
            date: new Date().toLocaleDateString(),
          };
        }),
        ...minioResults.map(doc => {
          const filename = doc.file_name;
          const type = filename.split('.').pop().toUpperCase();
          return {
            fileName: filename,
            title: filename.replace(/\.[^/.]+$/, ''),
            category: type,
            description: 'Dummy', // placeholder; will be replaced
            categoryType: 'digitalGrenada',
            date: doc.last_modified || new Date().toLocaleDateString(),
          };
        })
      ];

      // Remove duplicates based on fileName (case-insensitive)
      const uniqueResults = combinedResults.filter((item, index, self) =>
        index === self.findIndex(t => t.fileName.toLowerCase() === item.fileName.toLowerCase())
      );

      if (uniqueResults.length) {
        const docs = await Promise.all(
          uniqueResults.map(async (doc, i) => {
            const desc = await fetchDescription(doc.fileName);
            return { id: i.toString(), ...doc, description: desc };
          })
        );
        setFiles(docs);
        setCurrentPage(1);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  // Using the combined-search endpoint for text search.
  const handleSearch = async () => {
    // Clear tag selection when doing a text search.
    setSelectedTag(null);
    if (!searchQuery.trim()) {
      fetchDefaultFiles();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/combined-search/?title=${encodeURIComponent(searchQuery)}`
      );
      const result = await response.json();

      const elasticResults = result.elasticsearch_results || [];
      const minioResults = Array.isArray(result.minio_results) ? result.minio_results : [];
      // Combine results from both sources.
      const combinedResults = [
        ...elasticResults.map(filename => {
          const type = filename.split('.').pop().toUpperCase();
          return {
            fileName: filename,
            title: filename.replace(/\.[^/.]+$/, ''),
            category: type,
            description: 'Dummy', // placeholder; will be replaced
            categoryType: 'digitalGrenada',
            date: new Date().toLocaleDateString(),
          };
        }),
        ...minioResults.map(doc => {
          const filename = doc.file_name;
          const type = filename.split('.').pop().toUpperCase();
          return {
            fileName: filename,
            title: filename.replace(/\.[^/.]+$/, ''),
            category: type,
            description: 'Dummy', // placeholder; will be replaced
            categoryType: 'digitalGrenada',
            date: doc.last_modified || new Date().toLocaleDateString(),
          };
        })
      ];

      // Remove duplicates based on fileName (case-insensitive)
      const uniqueResults = combinedResults.filter((item, index, self) =>
        index === self.findIndex(t => t.fileName.toLowerCase() === item.fileName.toLowerCase())
      );

      if (uniqueResults.length) {
        const searchedFiles = await Promise.all(
          uniqueResults.map(async (doc, i) => {
            const desc = await fetchDescription(doc.fileName);
            return { id: i.toString(), ...doc, description: desc };
          })
        );
        setFiles(searchedFiles);
        setCurrentPage(1);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const applyFilters = async (updatedFilters) => {
    // When filters are applied, clear any selected tag.
    setSelectedTag(null);
    if (Object.keys(updatedFilters).length === 0) {
      fetchDefaultFiles();
      return;
    }
    const queryParams = Object.entries(updatedFilters)
      .flatMap(([key, values]) =>
        values.map(val => `${filterMapping[key]}=${encodeURIComponent(val)}`)
      )
      .join('&');
    const url = `${API_BASE_URL}/search/?${queryParams}`;
    setLoading(true);
    try {
      const res = await fetch(url);
      const result = await res.json();
      if (result.filenames) {
        // actually fetch each file's description
        const docs = await Promise.all(
          result.filenames.map(async (filename, i) => {
            const type = filename.split('.').pop().toUpperCase();
            const desc = await fetchDescription(filename);
            return {
              id: i.toString(),
              fileName: filename,
              title: filename.replace(/\.[^/.]+$/, ''),
              category: type,
              description: desc,
              categoryType: 'digitalGrenada',
              date: new Date().toLocaleDateString(),
            };
          })
        );
        setFiles(docs);
        setCurrentPage(1);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const toggleFilterValue = (filterKey, value) => {
    const prevValues = filterValues[filterKey] || [];
    const alreadySelected = prevValues.includes(value);
    const updated = {
      ...filterValues,
      [filterKey]: alreadySelected ? prevValues.filter(v => v !== value) : [...prevValues, value],
    };
    const cleaned = Object.fromEntries(Object.entries(updated).filter(([_, v]) => v.length));
    setFilterValues(cleaned);
    applyFilters(cleaned);
  };

  const handleDownload = (file) => {
    const url = `${API_BASE_URL}/download-file/${encodeURIComponent(file.fileName)}`;
    Linking.openURL(url).catch(err =>
      console.error("Failed to download file:", err)
    );
  };

  // Modified handleView function to fetch metadata from /file-metadata/ instead of description
  const handleView = async (file) => {
    if (openDetailId === file.id) {
      // If already open, close the detail section.
      setOpenDetailId(null);
      setSelectedFileDescription('');
      return;
    }
    setOpenDetailId(file.id);
    setDescLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/file-metadata/?filename=${encodeURIComponent(file.fileName)}`);
      const result = await response.json();
      // Set the returned metadata object (expected keys: "Document Version", "Present Status", "Publisher", "Date of Publishing")
      setSelectedFileDescription(result);
    } catch (err) {
      console.error("Failed to fetch metadata:", err);
      setSelectedFileDescription({ Error: "Error fetching metadata" });
    } finally {
      setDescLoading(false);
    }
  };

  const filteredFiles = selectedCategory
    ? files.filter(f => f.categoryType === selectedCategory)
    : files;
  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);
  const visibleFiles = filteredFiles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        range.push(i);
      } else if (!range.includes('...')) {
        range.push('...');
      }
    }
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
        {range.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => typeof item === 'number' && setCurrentPage(item)}
            style={{
              backgroundColor: item === currentPage ? '#333' : 'transparent',
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginHorizontal: 4,
            }}
          >
            <Text style={{ color: item === currentPage ? '#fff' : '#333' }}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Search Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 8}}>
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onKeyPress={e => e.nativeEvent.key === 'Enter' && handleSearch()}
          style={{ flex: 1, marginRight: 8, backgroundColor: '#fff' }}
        />
        <Button mode="contained" onPress={handleSearch} style={{ backgroundColor: '#000' }}>
          Search
        </Button>
      </View>
      {/* Main Content */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Left Column: Tags */}
        <View style={{ flex: 1, padding: 8, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#eee' }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Tags</Text>
            {tags.map(tag => {
              const isSelected = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => {
                    // If filters are active, ignore tag clicks.
                    if (Object.keys(filterValues).length > 0) return;
                    if (selectedTag === tag) {
                      setSelectedTag(null);
                      fetchDefaultFiles();
                    } else {
                      setSelectedTag(tag);
                      fetchByTag(tag);
                    }
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: isSelected ? '#000' : '#eee',
                    borderRadius: 20,
                    marginBottom: 6,
                    marginRight: 6,
                  }}
                >
                  <Text style={{ color: isSelected ? '#fff' : '#333' }}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        {/* Center Column: Files */}
        <View style={{ flex: 2, backgroundColor: '#fafafa' }}>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <ActivityIndicator animating={true} size="large" color="#000" />
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
              {visibleFiles.length ? visibleFiles.map(file => (
                <View key={file.id}>
                  <Surface
                    style={{ marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#eee' }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ backgroundColor: '#0af', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 12 }}>
                        {file.category}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#555' }}>{file.date}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{file.title}</Text>
                    {/* Now showing fetched description in the card */}
                    <Text style={{ fontSize: 13, color: '#444' }}>{file.description}</Text>
                    
                    {/* Detail section appears inside the card when open */}
                    {openDetailId === file.id && (
                      <View style={styles.detailContainer}>
                        {/* For PDF files, show the preview image on the left */}
                        {file.fileName.toLowerCase().endsWith('.pdf') && (
                          <Image
                            source={{ uri: `${API_BASE_URL}/preview-file/${encodeURIComponent(file.fileName)}` }}
                            style={styles.previewImage}
                          />
                        )}
                        {/* Display metadata from /file-metadata/ in vertical key-value form */}
                        <View style={styles.detailTextContainer}>
                          {descLoading ? (
                            <ActivityIndicator animating={true} size="small" color="#000" />
                          ) : (
                            selectedFileDescription && typeof selectedFileDescription === 'object' ? 
                              Object.entries(selectedFileDescription).map(([key, value]) => (
                                <View key={key} style={{ flexDirection: 'row', marginBottom: 4 }}>
                                  <Text style={{ fontWeight: 'bold', marginRight: 4 }}>{key}:</Text>
                                  <Text>{value}</Text>
                                </View>
                              ))
                              : (
                                <Text style={styles.detailText}>{selectedFileDescription}</Text>
                              )
                          )}
                        </View>
                      </View>
                    )}
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                      <Button
                        mode="contained"
                        onPress={() => handleView(file)}
                        style={{ backgroundColor: '#000', marginRight: 8 }}
                      >
                        {openDetailId === file.id ? "Close" : "View"}
                      </Button>
                      <Button mode="contained" onPress={() => handleDownload(file)} style={{ backgroundColor: '#000' }}>
                        Download
                      </Button>
                    </View>
                  </Surface>
                </View>
              )) : <Text>No files available</Text>}
              {renderPagination()}
            </ScrollView>
          )}
        </View>
        {/* Right Column: Filters */}
        <View style={{ flex: 1, backgroundColor: '#fafafa', padding: 8, borderLeftWidth: 1, borderLeftColor: '#eee' }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {Object.entries(filterOptionsWithValues).map(([filterName, values]) => (
              <View key={filterName} style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 4 }}>{filterName}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {values.map(val => {
                    const isActive = filterValues[filterName]?.includes(val);
                    return (
                      <TouchableOpacity
                        key={val}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          backgroundColor: isActive ? '#000' : '#eee',
                          borderRadius: 20,
                          marginRight: 6,
                          marginBottom: 6,
                        }}
                        onPress={() => toggleFilterValue(filterName, val)}
                      >
                        <Text style={{ color: isActive ? '#fff' : '#333' }}>{val}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

export default RepositoryContent;

const styles = StyleSheet.create({
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFC0C0',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6
  },
  previewImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginRight: 10
  },
  detailTextContainer: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 16
  },
  detailText: {
    fontSize: 14,
    lineHeight: 25,
    color: '#333'
  }
});
