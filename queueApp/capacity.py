def remaining_capacity(intervals, start, end, capacity):
    """Seats left at the busiest instant in [start, end); boundaries may touch."""
    events = []
    for other_start, other_end in intervals:
        if other_start < end and other_end > start:
            events.extend(((max(start, other_start), 1), (min(end, other_end), -1)))
    occupied = peak = 0
    for _, delta in sorted(events):
        occupied += delta
        peak = max(peak, occupied)
    return max(0, capacity - peak)
