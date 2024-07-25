import React, { useState, useEffect } from "react";
import { View, ScrollView, SafeAreaView, Text, StyleSheet } from "react-native";
import RideBanner from "../components/RideBanner";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FilterPanel from "../components/FilterPanel";
import { API_BASE_URL } from "../constants";

const RidesListScreen = ({ navigation }) => {
  const [rides, setRides] = useState([]);
  const [visit, setVisit] = useState([]);
  const [areaMap, setAreaMap] = useState({});
  const [filters, setFilters] = useState({
    type: [], //No filters selected
    area: [],
  });

  useEffect(() => {
    fetchRides();
    fetchAreas();
  }, [filters]);

  const rideTypeMap = {
    "Thrill Rides": "THRILL_RIDES",
    "Stage Shows": "STAGE_SHOWS",
    "Slow Rides": "SLOW_RIDES",
    "Roller Coaster": "ROLLER_COASTER",
    "Big Drops": "BIG_DROPS",
    "Small Drops": "SMALL_DROPS",
    Fireworks: "FIREWORKS",
    "Character Experience": "CHARACTER_EXPERIENCES",
    Parades: "PARADES",
    "Water Rides": "WATER_RIDES",
    Spinning: "SPINNING",
    "Live Entertainment": "LIVE",
    Dark: "DARK",
    Loud: "LOUD",
    Scary: "SCARY",
  };

  const fetchAreas = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/parkRides/theme_park_areas/`
      );
      const data = await response.json();
      const newAreaMap = {};
      data.forEach((area) => {
        newAreaMap[area.area_name] = area.area_id;
      });
      setAreaMap(newAreaMap);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchRides = async () => {
    try {
      let url = `${API_BASE_URL}/api/parkRides/theme_park_rides/`;
      let queryParameters = [];

      //Add query parameters based on the filters
      if (filters.type.length > 0) {
        let typeFilters = filters.type.map((type) => rideTypeMap[type]);
        queryParameters.push(`ride_type=${typeFilters.join(",")}`);
      }
      if (filters.area.length > 0) {
        let areaFilters = filters.area.map((area) => areaMap[area]);
        queryParameters.push(`area_id=${areaFilters.join(",")}`);
      }

      if (queryParameters.length > 0) {
        url += "?" + queryParameters.join("&");
      }
      const response = await fetch(url);
      const data = await response.json();
      setRides(data);
    } catch (error) {
      console.error(error);
    }
  };

  //TODO
  const handleAddToVisit = (ride) => {
    if (!visit.find((item) => item.ride_id === ride.ride_id)) {
      setVisit([...visit, ride]);
    } else {
      console.log("Ride already added to the visit");
    }
  };


  //TODO
  const handleRemoveFromVisit = (ride) => {
    setVisit(visit.filter((item) => item.ride_id !== ride.ride_id));
  };

  const handleClearFilters = () => {
    setFilters({
      type: [],
      area: [],
    });
  };

  const handleFilterChange = (filterType, selectedFilters) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterType]: selectedFilters,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header title="Virtual Q." />
      <FilterPanel
        filters={filters}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {rides.length > 0 ? (
          rides.map((ride) => (
            <View key={ride.ride_id}>
              <RideBanner ride={ride} navigation={navigation} />
            </View>
          ))
        ) : (
          <View style={styles.noRidesContainer}>
            <Text style={styles.noRidesText}>NO RIDES FOUND</Text>
          </View>
        )}
      </ScrollView>
      {/* Fixed footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffff",
  },
  content: {
    flexGrow: 1,
    backgroundColor: "#e1e2e3", // or any other color
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noRidesText: {
    fontSize: 18,
    color: "#333",
  },
});

export default RidesListScreen;
