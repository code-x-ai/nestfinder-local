import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to move the camera to the new location
function FlyToLocation({ coords }) {
  const map = useMap();
  map.flyTo(coords, 13); // 13 is the zoom level
  return null;
}

const PropertyMap = ({ locationName }) => {
  const [coords, setCoords] = useState([20.5937, 78.9629]); // Default: Center of India
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Use the FREE OpenStreetMap API to turn "Mumbai" into numbers (Lat/Lon)
    const getCoords = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${locationName}`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Could not find location on map");
      }
      setLoading(false);
    };

    if (locationName) {
      getCoords();
    }
  }, [locationName]);

  if (loading) return <div>Loading Map...</div>;

  return (
    <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-soft-xl border border-gray-200 z-0">
      <MapContainer center={coords} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={coords}>
          <Popup>{locationName}</Popup>
        </Marker>
        <FlyToLocation coords={coords} />
      </MapContainer>
    </div>
  );
};

export default PropertyMap;