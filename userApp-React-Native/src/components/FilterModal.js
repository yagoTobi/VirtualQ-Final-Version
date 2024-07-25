import React, { useState, useEffect } from "react";
import { Modal, View, Text, Button, FlatList, StyleSheet } from "react-native";
import { API_BASE_URL } from "../constants";

const FilterModal = ({ visible, filters, filterType, onClose }) => {
  // Local state to track selected filters
  const [selectedFilters, setSelectedFilters] = useState([filters]);
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAreasFromAPI = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/parkRides/theme_park_areas/`
      );
      const data = await response.json();
      const areaNames = data.map((item) => item.area_name);
      setAreas(areaNames);
      setIsLoading(false); // Add this line
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAreasFromAPI();
  }, []);

  //Set the selected filters when 'filters' prop changes
  useEffect(() => {
    if (filters) {
      setSelectedFilters(filters);
    }
  }, [filters]);

  // Close the modal and report the selected filters back to the parent component
  const handleDone = () => {
    onClose(filterType, selectedFilters);
  };

  // Return null if filters is not defined.
  if (!filters || !filterType) return null;

  // Toggle a filter on or off
  const toggleFilter = (filter) => {
    setSelectedFilters((prevFilters) => {
      if (prevFilters.includes(filter)) {
        // Filter is currently selected, so remove it
        return prevFilters.filter((f) => f !== filter);
      } else {
        // Filter is not currently selected, so add it
        return [...prevFilters, filter];
      }
    });
  };

  // You would need to define FILTER_OPTIONS somewhere in your code, e.g.:
  const FILTER_OPTIONS = {
    type: [
      "Roller Coaster",
      "Big Drops",
      "Small Drops",
      "Thrill Rides",
      "Slow Rides",
      "Stage Shows",
      "Fireworks",
      "Character Experience",
      "Parades",
      "Water Rides",
      "Spinning",
      "Live Entertainment",
      "Dark",
      "Loud",
      "Scary",
    ],
    area: areas,
  };

  if (isLoading) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>Select {filterType}</Text>
        <FlatList
          data={FILTER_OPTIONS[filterType]}
          renderItem={({ item }) => (
            <Button
              title={`${selectedFilters.includes(item) ? "✓ " : ""}${item}`}
              onPress={() => toggleFilter(item)}
            />
          )}
          keyExtractor={(item) => item}
        />
        <Button title="Done" onPress={handleDone} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default FilterModal;
