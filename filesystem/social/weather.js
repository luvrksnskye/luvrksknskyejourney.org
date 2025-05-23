// Function to fetch and display weather data using Open-Meteo API
const fetchWeather = (latitude, longitude) => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&current_weather=true`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      const weatherBox = document.querySelector('.weather-box');
      const temperature = weatherBox.querySelector('.temperature');
      const description = weatherBox.querySelector('.decription');
      const customMessage = weatherBox.querySelector('.custom-message');
      const humidity = document.querySelector('.info-humidity span');
      const wind = document.querySelector('.info-wind span');

      // Get current weather data
      const currentTemp = data.current_weather.temperature;
      const currentWeatherCode = data.current_weather.weathercode;
      const currentWindSpeed = data.current_weather.windspeed;
      
      // For humidity, we need to find the current hour's data
      const currentTime = new Date(data.current_weather.time);
      const hourIndex = data.hourly.time.findIndex(time => 
        new Date(time).getHours() === currentTime.getHours() && 
        new Date(time).getDate() === currentTime.getDate()
      );
      
      const currentHumidity = data.hourly.relative_humidity_2m[hourIndex];

      // Map weather codes to descriptions and images
      // Weather code mapping based on WMO standards used by Open-Meteo
      const weatherDescriptions = {
        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Depositing rime fog",
        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",
        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",
        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",
        66: "Light freezing rain",
        67: "Heavy freezing rain",
        71: "Slight snow fall",
        73: "Moderate snow fall",
        75: "Heavy snow fall",
        77: "Snow grains",
        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",
        85: "Slight snow showers",
        86: "Heavy snow showers",
        95: "Thunderstorm",
        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
      };

      // Map weather codes to image paths
      const weatherMap = {
        0: '../../assets/skye/clear.png',     // Clear sky
        1: '../../assets/skye/clear.png',     // Mainly clear
        2: '../../assets/skye/cloud.png',     // Partly cloudy
        3: '../../assets/skye/cloud.png',     // Overcast
        45: '../../assets/skye/mist.png',     // Fog
        48: '../../assets/skye/mist.png',     // Rime fog
        51: '../../assets/skye/rain.png',     // Light drizzle
        53: '../../assets/skye/rain.png',     // Moderate drizzle
        55: '../../assets/skye/rain.png',     // Dense drizzle
        56: '../../assets/skye/rain.png',     // Light freezing drizzle
        57: '../../assets/skye/rain.png',     // Dense freezing drizzle
        61: '../../assets/skye/rain.png',     // Slight rain
        63: '../../assets/skye/rain.png',     // Moderate rain
        65: '../../assets/skye/rain.png',     // Heavy rain
        66: '../../assets/skye/rain.png',     // Light freezing rain
        67: '../../assets/skye/rain.png',     // Heavy freezing rain
        71: '../../assets/skye/snow.png',     // Slight snow fall
        73: '../../assets/skye/snow.png',     // Moderate snow fall
        75: '../../assets/skye/snow.png',     // Heavy snow fall
        77: '../../assets/skye/snow.png',     // Snow grains
        80: '../../assets/skye/rain.png',     // Slight rain showers
        81: '../../assets/skye/rain.png',     // Moderate rain showers
        82: '../../assets/skye/rain.png',     // Violent rain showers
        85: '../../assets/skye/snow.png',     // Slight snow showers
        86: '../../assets/skye/snow.png',     // Heavy snow showers
        95: '../../assets/skye/rain.png',     // Thunderstorm
        96: '../../assets/skye/rain.png',     // Thunderstorm with slight hail
        99: '../../assets/skye/rain.png',     // Thunderstorm with heavy hail
      };

      // Get weather description and image
      const weatherDescription = weatherDescriptions[currentWeatherCode] || "Unknown";
      const weatherImage = weatherMap[currentWeatherCode] || '../../assets/skye/clear.png';

      // Messages depending on temperature
      let tempMessage;
      if (currentTemp < -20) {
        tempMessage = 'Extremely cold! Stay warm and safe!';
      } else if (currentTemp < -10) {
        tempMessage = 'Very cold! Grab a thick coat and gloves!';
      } else if (currentTemp < 0) {
        tempMessage = 'Brrr, it\'s freezing! Stay warm!';
      } else if (currentTemp < 5) {
        tempMessage = 'It\'s chilly, grab a light jacket!';
      } else if (currentTemp < 10) {
        tempMessage = 'It\'s a bit cool, perfect for a walk!';
      } else if (currentTemp < 15) {
        tempMessage = 'Mild and pleasant, enjoy the day!';
      } else if (currentTemp < 20) {
        tempMessage = 'Perfect weather, not too hot or cold!';
      } else if (currentTemp < 25) {
        tempMessage = 'Warm and sunny, great for outdoor activities!';
      } else if (currentTemp < 30) {
        tempMessage = 'It\'s getting hot, stay hydrated!';
      } else if (currentTemp < 35) {
        tempMessage = 'Very hot! Stay cool and take breaks!';
      } else {
        tempMessage = 'Extremely hot! Stay safe and indoors!';
      }

      // Update UI elements
      const image = weatherBox.querySelector('img');
      image.src = weatherImage;
      description.innerHTML = weatherDescription;
      customMessage.innerHTML = tempMessage;
      temperature.innerHTML = `${Math.round(currentTemp)}<span>°C</span>`;
      humidity.innerHTML = `${Math.round(currentHumidity)}%`;
      wind.innerHTML = `${currentWindSpeed} m/s`;

      // Show weather details
      weatherBox.style.display = 'block';
      document.querySelector('.weather-details').style.display = 'flex';
      weatherBox.classList.add('fadeIn');
      document.querySelector('.weather-details').classList.add('fadeIn');
    })
    .catch(error => {
      console.error('Error fetching weather data:', error);
      document.querySelector('.weather-box').innerHTML = '<p class="error-message">Weather data not available</p>';
    });
};

// Fetch weather data for a location (example: latitude and longitude for New York)
fetchWeather(40.730610, -73.935242);