import Svg, { Path, Ellipse } from "react-native-svg";
import { useResolveClassNames } from "uniwind";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Ride } from "@/lib/api";

// Illustrative positions only. All rides remain available in the list.
const positions = [
  "top-1/4 left-1/6",
  "top-1/3 right-1/6",
  "bottom-1/6 left-1/3",
  "top-8 left-1/2",
  "bottom-1/5 right-6",
  "top-1/2 left-6",
];

export function MapSchematic({
  rides,
  selected,
  onSelect,
  className = "",
}: {
  rides: Ride[];
  selected?: number;
  onSelect: (id: number) => void;
  className?: string;
}) {
  const park = useResolveClassNames("text-secondary");
  const paths = useResolveClassNames("text-card");
  const lake = useResolveClassNames("text-primary");
  return (
    <Box className={`overflow-hidden bg-secondary ${className}`}>
      <Box className="absolute inset-0" aria-hidden pointerEvents="none">
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 360 384"
          preserveAspectRatio="none"
        >
          <Path d="M0 0H360V384H0Z" fill={park.color} />
          <Path
            d="M36 340C190 350 280 290 270 222S77 272 67 152 238 45 337 54"
            fill="none"
            stroke={paths.color}
            strokeWidth={22}
            strokeLinecap="round"
          />
          <Path
            d="M140 322C163 227 176 151 299 137"
            fill="none"
            stroke={paths.color}
            strokeWidth={14}
            strokeLinecap="round"
          />
          <Ellipse
            cx={227}
            cy={73}
            rx={38}
            ry={25}
            fill={lake.color}
            opacity={0.18}
          />
          <Ellipse
            cx={42}
            cy={272}
            rx={31}
            ry={47}
            fill={lake.color}
            opacity={0.12}
          />
          <Ellipse
            cx={301}
            cy={316}
            rx={44}
            ry={30}
            fill={lake.color}
            opacity={0.12}
          />
        </Svg>
      </Box>
      {rides.slice(0, 6).map((ride, index) => (
        <Button
          key={ride.ride_id}
          size="icon"
          variant={selected === ride.ride_id ? "default" : "outline"}
          className={`absolute ${positions[index]} rounded-full w-12 h-12`}
          accessibilityState={{ selected: selected === ride.ride_id }}
          accessibilityLabel={`Map pin ${index + 1}: ${ride.ride_name}${ride.under_maintenance ? ", under maintenance" : ""}`}
          onPress={() => onSelect(ride.ride_id)}
        >
          <ButtonText>{index + 1}</ButtonText>
        </Button>
      ))}
    </Box>
  );
}
