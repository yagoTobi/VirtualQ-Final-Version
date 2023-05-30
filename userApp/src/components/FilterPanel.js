import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import FilterButton from "./FilterButton";
import FilterModal from "./FilterModal";

const FilterPanel = ({ filters, handleFilterChange }) => {
  const [showModal, setShowModal] = useState({
    visible: false,
    filterType: null,
  });

  const handleOpenModal = (filterType) => {
    setShowModal({
      visible: true,
      filterType,
    });
  };

  const handleCloseModal = (filterType, newFilters) => {
    setShowModal({
      visible: false,
      filterType: null,
    });

    // Update the filters state with the new filters
    handleFilterChange(filterType, newFilters);
  };

  const handleClearFilters = () => {
    handleFilterChange("type", []);
    handleFilterChange("area", []);
  };

  return (
    <View style={styles.container}>
      <FilterButton title=" X " active={false} onPress={handleClearFilters} />

      <FilterButton
        title="Filter Ride Type"
        active={
          showModal.filterType === "type" ||
          (filters.type && filters.type.length > 0)
        }
        activeColor={"#0000ff"}
        onPress={() => handleOpenModal("type")}
        filtersCount={(filters.type && filters.type.length) || 0}
      />

      <FilterButton
        title="Filter Park Area"
        active={
          showModal.filterType === "area" ||
          (filters.area && filters.area.length > 0)
        }
        activeColor={"#0000ff"}
        onPress={() => handleOpenModal("area")}
        filtersCount={(filters.area && filters.area.length) || 0}
      />

      <FilterModal
        visible={showModal.visible}
        filters={filters[showModal.filterType]}
        filterType={showModal.filterType}
        onClose={handleCloseModal}
        onChange={(newFilters) =>
          handleFilterChange(showModal.filterType, newFilters)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 5,
    backgroundColor: "#e1e2e3",
  },
});

export default FilterPanel;
