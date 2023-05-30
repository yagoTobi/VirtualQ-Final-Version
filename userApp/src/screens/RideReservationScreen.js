import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  FlatList,
  Modal,
} from "react-native";

import {
  addMinutes,
  compareAsc,
  format,
  formatISO,
  differenceInDays,
} from "date-fns";

import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthContext from "../AuthContext";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import { API_BASE_URL } from "../constants";
import { Checkbox } from "react-native-paper";
import Toast from "react-native-toast-message";

const RideReservationScreen = ({ route, navigation }) => {
  const { ride } = route.params;
  const { token } = useContext(AuthContext);

  // Your states and functions...
  const [guests, setGuests] = useState([]);
  const [dates, setDates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTimeslot, setSelectedTimeslot] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [guestsForSelectedDate, setGuestsForSelectedDate] = useState([]);
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuests();
  }, []);

  const getTimeslots = () => {
    let timeslots = [];
    let start = new Date();
    start.setHours(parseInt(ride.opening_hour.slice(0, 2)));
    start.setMinutes(parseInt(ride.opening_hour.slice(3, 5)));
    const end = new Date();
    end.setHours(parseInt(ride.closing_hour.slice(0, 2)));
    end.setMinutes(parseInt(ride.closing_hour.slice(3, 5)));

    while (compareAsc(start, end) !== 1) {
      timeslots.push(format(start, "HH:mm"));
      start = addMinutes(start, 30);
    }
    return timeslots;
  };

  const [timeslots, setTimeslots] = useState(getTimeslots());

  async function getUserDetails(token) {
    setLoading(true); // Start loading
    const response = await fetch(`${API_BASE_URL}/api/clients/user/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    let user = await response.json();
    user.dob = new Date(user.dob); // convert dob string to Date object
    setLoading(false);
    return user;
  }

  function groupGuestsByDate(guestData) {
    return guestData.reduce((groupedGuests, guest) => {
      // Use the date_of_visit as the key for the groupedGuests object.
      // If it doesn't already exist in the object, create a new array for it.
      const date = guest.date_of_visit;
      if (!groupedGuests[date]) {
        groupedGuests[date] = [];
      }

      // Add the guest to the array for this date.
      groupedGuests[date].push(guest);

      return groupedGuests;
    }, {});
  }

  async function fetchGuests() {
    try {
      setLoading(true);
      const userResponse = await getUserDetails(token);
      const guestResponse = await fetch(
        `${API_BASE_URL}/api/tickets/guests/guests/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!guestResponse.ok) {
        throw new Error("Network response was not ok");
      }

      const guestData = await guestResponse.json();
      const userData = {
        guest_id: userResponse.id, //assuming there is an id field, adjust this if needed
        name: userResponse.name, // use your user's name here
      };

      let groupedData = groupGuestsByDate(guestData);

      // Add user data to the guest list for every date
      for (const date in groupedData) {
        groupedData[date].push({ ...userData, date_of_visit: date });
      }

      let sortedDates = Object.keys(groupedData);
      sortedDates.sort((a, b) => new Date(a) - new Date(b)); // Sort the dates in ascending order
      setDates(sortedDates);
      setGuests(groupedData);
      setLoading(false);
    } catch (error) {
      console.error("fetchGuests failed:", error);
      setLoading(false);
    }
  }

  const getTickets = async (selectedDate) => {
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    const response = await fetch(
      `${API_BASE_URL}/api/tickets/tickets-view/?date_of_visit=${formattedDate}`,
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tickets");
    }

    const ticketsData = await response.json();
    console.log("Tickets data received:", ticketsData);
    const ticketsGuestsMap = {}; // This will store guests linked to their tickets.
    let unassignedTicket = null;

    for (const ticket of ticketsData) {
      if (ticket.guest_number > 0) {
        const guestResponse = await fetch(
          `${API_BASE_URL}/api/tickets/guests/guest-view/?ticket_id=${ticket.id}`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );
        if (!guestResponse.ok) {
          throw new Error(`Failed to fetch guest for ticket id ${ticket.id}`);
        }
        const guestData = await guestResponse.json();
        console.log(
          `Guest data received for ticket id ${ticket.id}:`,
          guestData
        );
        if (
          Array.isArray(guestData) &&
          guestData.length > 0 &&
          "guest_id" in guestData[0]
        ) {
          ticketsGuestsMap[guestData[0].guest_id] = ticket.id;
        } else if (!Array.isArray(guestData) && "guest_id" in guestData) {
          ticketsGuestsMap[guestData.guest_id] = ticket.id;
        } else {
          console.error("No guest data received for ticket id", ticket.id);
        }
      } else {
        unassignedTicket = ticket.id;
      }
    }

    return { tickets: ticketsData, ticketsGuestsMap, unassignedTicket };
  };

  const handleTimeslotPress = (timeslot) => {
    if (!selectedDate || differenceInDays(selectedDate, new Date()) > 15) {
      Alert.alert(
        "Virtual Q. doesn't allow for reservations over 15 days in advance"
      );
      return;
    }
    setSelectedTimeslot(timeslot);
    setModalVisible(true);
  };

  const onDateChange = (newDate) => {
    const parsedDate = new Date(newDate);
    // Check if selected date is more than 15 days in advance
    if (differenceInDays(parsedDate, new Date()) > 15) {
      Alert.alert(
        "Virtual Q. doesn't allow for reservations over 15 days in advance"
      );
      return;
    }
    setSelectedDate(parsedDate);
    setGuestsForSelectedDate(guests[newDate.toString()] || []);
  };

  const handleSelectGuest = (guestId) => {
    if (selectedGuests.includes(guestId)) {
      setSelectedGuests((prevSelectedGuests) =>
        prevSelectedGuests.filter((guest) => guest !== guestId)
      );
    } else {
      setSelectedGuests((prevSelectedGuests) => [
        ...prevSelectedGuests,
        guestId,
      ]);
    }
  };

  const renderGuestCheckbox = ({ item }) => (
    <View style={styles.guestCheckbox}>
      <TouchableOpacity onPress={() => handleSelectGuest(item.guest_id)}>
        <Text style={styles.guestCheckboxText}>{item.name}</Text>
      </TouchableOpacity>
      <Checkbox
        status={
          selectedGuests.includes(item.guest_id) ? "checked" : "unchecked"
        }
        onPress={() => handleSelectGuest(item.guest_id)}
        color="blue" // Set the color to blue
      />
    </View>
  );

  const handleConfirm = async () => {
    const user = await getUserDetails(token);
    try {
      let { ticketsGuestsMap, unassignedTicket } = await getTickets(
        selectedDate
      );
      console.log("Tickets and guests map received:", ticketsGuestsMap);
      console.log("Unassigned ticket ID:", unassignedTicket);

      let newReservations = [];
      for (let i = 0; i < selectedGuests.length; i++) {
        let ticketId =
          selectedGuests[i] === user.id
            ? unassignedTicket
            : ticketsGuestsMap[selectedGuests[i]];
        console.log(`Ticket ID for guest ${selectedGuests[i]}:`, ticketId);

        console.log("Sending new reservations:", newReservations);

        if (ticketId) {
          newReservations.push(
            buildNewReservation(
              ride.ride_id,
              selectedDate,
              selectedTimeslot,
              ticketId
            )
          );
        } else {
          console.log(
            `Unable to get the ticket for guest ${selectedGuests[i]}`
          );
        }
      }
      await createReservations(newReservations);
    } catch (error) {
      console.error(error);
      return;
    }

    setModalVisible(!modalVisible);
  };

  const buildNewReservation = (rideId, date, selectedTimeslot, ticket) => {
    const [hour, minute] = selectedTimeslot.split(":");
    const startTime = new Date();
    startTime.setHours(hour, minute, 0);

    return {
      ticket: ticket,
      ride: rideId,
      date: formatISO(date, { representation: "date" }), // Format the date as 'YYYY-MM-DD'
      start_time: format(startTime, "HH:mm:ss"),
      validated: false,
    };
  };

  const createReservations = async (newReservations) => {
    const body = JSON.stringify(newReservations);
    console.log(body);

    const response = await fetch(`${API_BASE_URL}/api/queue/reservations/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      if (errorResponse && errorResponse.detail) {
        Alert.alert("Error", errorResponse.detail);
      }
      throw new Error("Failed to create reservation");
    }

    const createdReservations = await response.json();
    console.log(createdReservations);
    Toast.show({
      type: "success",
      text1: "Reservation success!",
      text2: "Check your reservations on the Virtual Q. Reservations Page!",
    });
  };

  const renderTimeslot = ({ item }) => (
    <TouchableOpacity
      style={styles.timeslot}
      onPress={() => handleTimeslotPress(item)}
    >
      <Text style={styles.timeslotText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <Header title="Virtual Q." />
        {/* Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <Text style={styles.modalText}>
                  Booking the {selectedTimeslot} slot for {ride.ride_name}.
                </Text>
                <Text style={styles.modalSubText}>
                  Select the guests for your booking.
                </Text>
                <View style={styles.counterContainer}>
                  <FlatList
                    data={guestsForSelectedDate}
                    renderItem={renderGuestCheckbox}
                    keyExtractor={(item) => item.guest_id.toString()}
                  />
                </View>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => handleConfirm()}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        {/* Ride Image */}
        <View style={styles.imageContainer}>
          <Image
            style={styles.rideImage}
            source={{ uri: ride.ride_thumbnail }}
          />
          <View style={styles.imageOverlay}>
            <Text style={styles.title}>{ride.ride_name}</Text>
            <FontAwesome name="star" size={30} color="white" />
          </View>
        </View>
        {/* Title */}
        <Text style={styles.reserveTitle}>
          Reserve your time slot using Virtual Q.
        </Text>
        {/*Inside your component*/}
        <Picker
          selectedValue={
            selectedDate ? format(selectedDate, "do MMMM yyyy") : ""
          }
          onValueChange={onDateChange}
        >
          {dates.map((date) => (
            <Picker.Item
              key={date}
              label={format(new Date(date), "do MMMM yyyy")}
              value={date}
            />
          ))}
        </Picker>

        {/* Timeslots Grid */}
        <FlatList
          data={timeslots}
          renderItem={renderTimeslot}
          keyExtractor={(item) => item}
          numColumns={4}
          style={styles.timeslotsGrid}
        />
        {/* Footer */}
        <Footer navigation={navigation} />
      </SafeAreaView>
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  imageContainer: {
    width: "100%",
    height: Dimensions.get("window").height * 0.3, // 30% of screen height
  },
  rideImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.7,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  timeslotsGrid: {
    flex: 1,
  },
  timeslot: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 25, // Make button more pill-like
    padding: 10,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    height: 50, // Fixed height for all buttons
  },
  timeslotText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
  reserveTitle: {
    fontWeight: "bold",
    fontSize: 20,
    padding: 10,
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: "rgba(0,0,0,0.5)", // corrected rgba value
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%", // To set a specific width for the modal
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalSubText: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 16,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  counterButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  counterValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "50%", // adjust width as needed
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#2196F3",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: "50%", // adjust width as needed
  },
  guestCheckbox: {
    flexDirection: "row", // Set the flexDirection to "row"
    alignItems: "center", // Align the items to center
    justifyContent: "space-between", // Add some space between the text and the checkbox
    padding: 10, // Add some padding
  },
});

export default RideReservationScreen;
