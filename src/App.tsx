
import { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  Marker,
  Polyline,
} from "@vis.gl/react-google-maps";
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase"; // Assuming you have firebase initialized and exported auth

import "./App.css";

// TODO: Get a Google Maps Platform API key:
/*
 * 1. Open the Project IDX view by pressing Ctrl+Shift+P / Cmd+Shift+P and type "IDX focus", then select "IDX: Focus on Project IDX View"
 * 2. Click on the "Google Maps Platform" integration.
 * 3. Click "Enable APIs" to enable the Google Maps Platform APIs.
 * 4. Click "Get API Key" to get an API key.
 * 5. Create a file named .env.local in the root directory. The .local suffix keeps secrets out of source control.
 * 6. In the file, add the line: VITE_MAPS_API_KEY=YOUR_API_KEY.
 * 7. Replace YOUR_API_KEY with the API key you got in step 4. */
const MAPS_API_KEY = import.meta.env.VITE_MAPS_API_KEY as string;

// Mock device data, replace with your actual data fetching logic
const mockDevices = [
  { id: "device1", name: "Device 1", feed: "feed1" },
  { id: "device2", name: "Device 2", feed: "feed2" },
  { id: "device3", name: "Device 3", feed: "feed3" },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [devices, setDevices] = useState(mockDevices);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deviceData, setDeviceData] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential) {
          const token = credential.accessToken;
          // The signed-in user info.
          const user = result.user;
          setUser(user);
        }
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        console.error(error);
      });
  };

  const handleDeviceSelection = (deviceId: string) => {
    setSelectedDevices((prevSelected) =>
      prevSelected.includes(deviceId)
        ? prevSelected.filter((id) => id !== deviceId)
        : [...prevSelected, deviceId]
    );
  };

  // Fetch data from Adafruit IO
  useEffect(() => {
    const fetchData = async (feed: string, deviceId: string) => {
      // Replace with your actual Adafruit IO API endpoint and credentials
      const response = await fetch(
        `https://io.adafruit.com/api/v2/YOUR_USERNAME/feeds/${feed}/data`
      );
      const data = await response.json();
      setDeviceData((prevData) => ({ ...prevData, [deviceId]: data }));
    };

    selectedDevices.forEach((deviceId) => {
      const device = devices.find((d) => d.id === deviceId);
      if (device) {
        fetchData(device.feed, deviceId);
      }
    });
  }, [selectedDevices, devices]);

  if (!user) {
    return (
      <div className="login-container">
        <h1>Device Tracker</h1>
        <button onClick={handleGoogleLogin}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <>
      <h1>Device Tracker</h1>
      <div className="device-selector">
        <h2>Select Devices to Track:</h2>
        {devices.map((device) => (
          <label key={device.id}>
            <input
              type="checkbox"
              checked={selectedDevices.includes(device.id)}
              onChange={() => handleDeviceSelection(device.id)}
            />
            {device.name}
          </label>
        ))}
      </div>

      <div id="map">
        <APIProvider
          apiKey={MAPS_API_KEY}
          solutionChannel="GMP_idx_templates_v0_reactts"
        >
          <Map
            mapId={"DEMO_MAP_ID"}
            defaultCenter={{ lat: 22.5726, lng: 88.3639 }}
            defaultZoom={10}
            disableDefaultUI={true}
          >
            {selectedDevices.map((deviceId) => {
              const data = deviceData[deviceId];
              if (!data) return null;

              const path = data.map((d: any) => {
                const [lat, lng] = d.value.split(',');
                return { lat: parseFloat(lat), lng: parseFloat(lng) };
              });

              return (
                <>
                  <Polyline path={path} strokeColor="#ff0000" />
                  {path.length > 0 && <Marker position={path[path.length - 1]} />}
                </>
              );
            })}
          </Map>
        </APIProvider>
      </div>
    </>
  );
}

export default App;
