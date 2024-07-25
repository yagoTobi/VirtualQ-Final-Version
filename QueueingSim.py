import random
import heapq
import numpy as np

simulation_time = 480  # in minutes (8 hours)

# Each customer with their arrival time and whether they have a FP or not
class Customer:
    def __init__(self, arrival_time, fast_pass=False):
        self.arrival_time = arrival_time
        self.fast_pass = fast_pass


# Represent events in the simulation, with methods to compare events by their time.
class Event:
    def __init__(self, time, event_type, customer=None):
        self.time = time
        self.event_type = event_type
        self.customer = customer

    def __lt__(self, other):
        return self.time < other.time


def generate_inter_arrival_time():
    return np.random.exponential(scale=3)


def generate_service_time():
    return np.random.uniform(low=2, high=5)


def generate_customer(arrival_time):
    fast_pass_probability = 0.2
    has_fast_pass = random.random() < fast_pass_probability
    return Customer(arrival_time, fast_pass=has_fast_pass)


class ThemePark:  # Class with methods to handle arrivals, departures, and service start.
    def __init__(self, queue_type):
        # Parameter definition.
        self.queue_type = queue_type
        self.queue_normal = []
        self.queue_fast_pass = []
        self.queue_walk_in = []
        self.queue_virtual = []
        self.pre_reservation_limit = 0.75
        self.realtime_reservation_limit = 0.85
        self.walkin_limit = 0.15
        self.ride_capacity = 100
        self.pre_slots = int(self.ride_capacity * self.pre_reservation_limit)
        self.realtime_slots = int(
            self.ride_capacity * (self.realtime_reservation_limit - self.pre_reservation_limit))
        self.walkin_slots = int(self.ride_capacity * self.walkin_limit)
        self.total_waiting_time = 0
        self.num_customers_served = 0
        self.ride_busy = False

    def simulate(self):  # Simulate method
        event_list = []
        heapq.heapify(event_list)

        # Generate initial customer arrival
        arrival_time = generate_inter_arrival_time()
        customer = Customer(arrival_time)
        event = Event(arrival_time, "arrival", customer)
        heapq.heappush(event_list, event)

        # Process events
        while event_list:
            event = heapq.heappop(event_list)
            current_time = event.time

            if current_time > simulation_time:
                break

            if event.event_type == "arrival":
                self.handle_arrival(event, event_list)
            elif event.event_type == "departure":
                self.handle_departure(event, event_list)

    def handle_arrival(self, event, event_list):
        customer = event.customer

        if self.queue_type == "standard":
            if customer.fast_pass:
                self.queue_fast_pass.append(customer)
            else:
                self.queue_normal.append(customer)
        elif self.queue_type == "virtual":
            if len(self.queue_virtual) < self.realtime_slots:
                self.queue_virtual.append(customer)
            else:
                self.queue_walk_in.append(customer)

        # Generate next arrival event
        arrival_time = event.time + generate_inter_arrival_time()
        next_customer = generate_customer(arrival_time)
        next_event = Event(arrival_time, "arrival", next_customer)
        heapq.heappush(event_list, next_event)

        # Check if the ride is available
        if not self.ride_busy:
            self.start_service(event_list)

    def handle_departure(self, event, event_list):
        if self.queue_type == "standard":
            if self.queue_fast_pass:
                self.queue_fast_pass.pop(0)
            elif self.queue_normal:
                self.queue_normal.pop(0)
        elif self.queue_type == "virtual":
            if self.queue_virtual:
                self.queue_virtual.pop(0)
            elif self.queue_walk_in:
                self.queue_walk_in.pop(0)

        self.total_waiting_time += event.time - event.customer.arrival_time
        self.num_customers_served += 1
        self.ride_busy = False

        # Check if there are customers still waiting
        if self.queue_fast_pass or self.queue_normal or self.queue_virtual or self.queue_walk_in:
            self.start_service(event_list)

    def start_service(self, event_list):
        current_time = event_list[0].time

        if self.queue_type == "standard":
            if self.queue_fast_pass:
                customer = self.queue_fast_pass[0]
            elif self.queue_normal:
                customer = self.queue_normal[0]
            else:
                return
        elif self.queue_type == "virtual":
            if self.queue_virtual:
                customer = self.queue_virtual[0]
            elif self.queue_walk_in:
                customer = self.queue_walk_in[0]
            else:
                return

        self.ride_busy = True
        service_time = generate_service_time()
        departure_time = current_time + service_time
        departure_event = Event(departure_time, "departure", customer)
        heapq.heappush(event_list, departure_event)


standard_theme_park = ThemePark(queue_type="standard")
standard_theme_park.simulate()

virtual_queue_system = ThemePark(queue_type="virtual")
virtual_queue_system.simulate()

# Compare performance metrics
standard_avg_wait = standard_theme_park.total_waiting_time / \
    standard_theme_park.num_customers_served
virtual_avg_wait = virtual_queue_system.total_waiting_time / \
    virtual_queue_system.num_customers_served

print(
    f"Standard theme park: Average waiting time: {standard_avg_wait:.2f} minutes")
print(
    f"Virtual queue system: Average waiting time: {virtual_avg_wait:.2f} minutes")