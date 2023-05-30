import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  FlatList,
  Dimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import Modal from "react-native-modal";
import Carousel from "react-native-snap-carousel";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AuthContext from "../AuthContext";
import { API_BASE_URL } from "../constants";
import { Ionicons } from "@expo/vector-icons";
import { Pagination } from "react-native-snap-carousel";
import { format } from "date-fns";

const TicketHubScreen = ({ navigation }) => {
  const { token } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    // Fetch tickets from your backend here
    // This is just a placeholder, replace it with your actual fetch call
    const response = await fetch(`${API_BASE_URL}/api/tickets/tickets-view/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setTickets(data);
    } else {
      console.error("Failed to fetch tickets");
    }
  };

  const handleBookTickets = () => {
    //TODO Replace this URL with the URL of your Django template
    const url = `${API_BASE_URL}/api/tickets/login/`;
    Linking.openURL(url);
  };

  const handleTicketPress = (date) => {
    setSelectedTickets(groupedTickets[date]);
  };

  const handleModalClose = () => {
    setSelectedTickets(null);
  };

  const groupedTickets = tickets.reduce((groups, ticket) => {
    const date = ticket.date_of_visit;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(ticket);
    return groups;
  }, {});

  const dates = Object.keys(groupedTickets);

  const renderCarouselItem = ({ item, index }) => (
    <View style={styles.carouselItem}>
      <Text style={styles.carouselItemTitle}>Visitor {index + 1}</Text>
      <Text style={styles.carouselItemSubtitle}>
        {format(new Date(item.date_of_visit), "EEEE, MMMM do yyyy")}
      </Text>
      <QRCode value={item.ticket_id.toString()} size={200} />
    </View>
  );
  return (
    <View style={styles.container}>
      <Header title="Virtual Q." />
      <Text style={styles.title}>Your Tickets</Text>
      {dates.length > 0 ? (
        <FlatList
          data={dates}
          keyExtractor={(item) => item}
          renderItem={({ item: date }) => (
            <View>
              <Text style={styles.date}>
                {format(new Date(date), "EEEE, MMMM do yyyy")}
              </Text>
              {groupedTickets[date].map((ticket, index) => (
                <TouchableOpacity
                  key={ticket.ticket_id}
                  style={styles.ticketContainer}
                  onPress={() => handleTicketPress(date)}
                >
                  <Text style={styles.ticketId}>Visitor {index + 1}</Text>
                  <QRCode value={ticket.ticket_id.toString()} size={80} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyTicketsContainer}>
          <Text style={styles.emptyTicketsText}>
            You haven't booked any tickets yet.
          </Text>
          <TouchableOpacity
            style={styles.bookTicketsButton}
            onPress={handleBookTickets}
          >
            <Text style={styles.bookTicketsButtonText}>Book Tickets</Text>
          </TouchableOpacity>
        </View>
      )}
      <Footer navigation={navigation} />
      <Modal
        isVisible={!!selectedTickets}
        onBackdropPress={handleModalClose}
        style={styles.modal}
      >
        <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
          <Ionicons name="close-circle" size={36} color="black" />
        </TouchableOpacity>
        {selectedTickets && (
          <>
            <Carousel
              data={selectedTickets}
              renderItem={renderCarouselItem}
              sliderWidth={Dimensions.get("window").width}
              itemWidth={Dimensions.get("window").width}
              onSnapToItem={(index) => setActiveSlide(index)}
              containerCustomStyle={styles.carouselContainer}
            />
            <Pagination
              dotsLength={selectedTickets.length}
              activeDotIndex={activeSlide}
              containerStyle={styles.paginationContainer}
              dotStyle={styles.paginationDot}
              inactiveDotOpacity={0.4}
              inactiveDotScale={0.6}
            />
          </>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1175c2",
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginVertical: 20,
    color: "white",
  },
  date: {
    fontSize: 18,
    color: "white",
    marginVertical: 10,
    marginLeft: 10,
  },
  ticketContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  ticketId: {
    flex: 1,
    fontSize: 16,
    color: "#1175c2",
  },
  emptyTicketsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTicketsText: {
    fontSize: 18,
    color: "white",
    marginBottom: 20,
  },
  bookTicketsButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
  },
  bookTicketsButtonText: {
    color: "#1175c2",
    fontSize: 18,
  },
  carouselItem: {
    alignItems: "center",
    padding: 20,
  },
  carouselItemTitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  carouselItemSubtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  paginationContainer: {
    paddingTop: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 2,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modal: {
    justifyContent: "flex-end",
    margin: 0,
    backgroundColor: "white",
    marginTop: "95%", // Push modal further down the screen
    borderRadius: 15, // Adds rounded corners
    overflow: "hidden", // Ensures the rounded corners are visible
  },
  carouselContainer: {
    marginTop: 20, // Add some space between the carousel and close button
  },
});

export default TicketHubScreen;
