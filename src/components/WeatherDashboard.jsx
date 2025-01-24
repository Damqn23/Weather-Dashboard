// WeatherDashboard.jsx
import { useState } from "react";
import SearchBar from "./SearchBar";
import API_KEY from "../config";
import "../styles/WeatherDashboard.css";
import { CSSTransition, TransitionGroup } from "react-transition-group";

function WeatherDashboard() {
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentCity, setCurrentCity] = useState("");
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState("forward"); // New state

  const onSearch = async (city) => {
    setLoading(true);
    setError(null);
    setHourlyForecast([]);
    setCurrentCity("");
    setCurrentDayIndex(0);
    setTransitionDirection("forward"); // Reset direction on new search

    const geoApiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;

    try {
      const geoResponse = await fetch(geoApiUrl);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("City not found");
      }

      const { lat, lon } = geoData[0];

      const forecastApiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      const forecastResponse = await fetch(forecastApiUrl);

      if (!forecastResponse.ok) {
        throw new Error("Failed to fetch hourly forecast data");
      }

      const forecastData = await forecastResponse.json();

      const enhancedForecast = forecastData.list.map((hour) => ({
        ...hour,
      }));

      // Group forecasts by date
      const groupedByDay = enhancedForecast.reduce((acc, hour) => {
        const date = new Date(hour.dt * 1000).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(hour);
        return acc;
      }, {});

      setHourlyForecast(groupedByDay);
      setCurrentCity(`${geoData[0].name}, ${geoData[0].country}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (condition, timeString) => {
    const moonHours = ["02:00", "05:00", "20:00", "23:00"];
    if (condition.includes("clear") && moonHours.includes(timeString)) {
      return "🌙"; // Moon icon for specific hours
    }
    if (condition.includes("clear")) {
      return "☀️"; // Sun icon for all other hours when clear
    }
    if (condition.includes("cloud")) return "☁️"; // Cloudy
    if (condition.includes("rain")) return "🌧️"; // Rainy
    if (condition.includes("snow")) return "❄️"; // Snowy
    return "🌫️"; // Default icon
  };

  const handleNextDay = () => {
    if (currentDayIndex < Object.keys(hourlyForecast).length - 1) {
      setTransitionDirection("forward"); // Set direction to forward
      setCurrentDayIndex((prev) => prev + 1);
    }
  };

  const handlePreviousDay = () => {
    if (currentDayIndex > 0) {
      setTransitionDirection("backward"); // Set direction to backward
      setCurrentDayIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="weather-dashboard">
      <SearchBar onSearch={onSearch} />
      {currentCity && <h2 className="current-city">Weather for {currentCity}</h2>}
      {loading && <p className="loading">Fetching hourly forecast...</p>}
      {error && <p className="error-message">{error}</p>}

      {Object.keys(hourlyForecast).length > 0 && (
        <div className="day-navigation">
          <button
            className="nav-button"
            onClick={handlePreviousDay}
            disabled={currentDayIndex === 0}
          >
            ⬅️ Previous
          </button>

          <TransitionGroup className="forecast-day-container">
            <CSSTransition
              key={Object.keys(hourlyForecast)[currentDayIndex]}
              timeout={500}
              classNames={
                transitionDirection === "forward" ? "slide-forward" : "slide-backward"
              }
            >
              <div className="forecast-day">
                <h3 className="day-title">
                  {Object.keys(hourlyForecast)[currentDayIndex]}
                </h3>
                <div className="hourly-forecast">
                  {hourlyForecast[Object.keys(hourlyForecast)[currentDayIndex]].map(
                    (hour, idx) => {
                      const timeString = new Date(hour.dt * 1000).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      );
                      return (
                        <div key={idx} className="hourly-forecast-item">
                          <p className="hourly-time">{timeString}</p>
                          <p className="hourly-temp">
                            {hour.main.temp.toFixed(1)}°C
                          </p>
                          <p className="hourly-condition">
                            {getIcon(
                              hour.weather[0].description.toLowerCase(),
                              timeString
                            )}
                          </p>
                          <p className="hourly-description">
                            {hour.weather[0].description}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </CSSTransition>
          </TransitionGroup>

          <button
            className="nav-button"
            onClick={handleNextDay}
            disabled={currentDayIndex === Object.keys(hourlyForecast).length - 1}
          >
            Next ➡️
          </button>
        </div>
      )}
    </div>
  );
}

export default WeatherDashboard;
