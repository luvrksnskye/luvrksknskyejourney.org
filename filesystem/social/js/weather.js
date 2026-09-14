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

      const currentTemp = data.current_weather.temperature;
      const currentWeatherCode = data.current_weather.weathercode;
      const currentWindSpeed = data.current_weather.windspeed;
      
      const currentTime = new Date(data.current_weather.time);
      const hourIndex = data.hourly.time.findIndex(time => 
        new Date(time).getHours() === currentTime.getHours() && 
        new Date(time).getDate() === currentTime.getDate()
      );
      
      const currentHumidity = data.hourly.relative_humidity_2m[hourIndex];

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

      const weatherMap = {
        0: '/assets/images/skye/clear.png',
        1: '/assets/images/skye/clear.png',
        2: '/assets/images/skye/cloud.png',
        3: '/assets/images/skye/cloud.png',
        45: '/assets/images/skye/mist.png',
        48: '/assets/images/skye/mist.png',
        51: '/assets/images/skye/rain.png',
        53: '/assets/images/skye/rain.png',
        55: '/assets/images/skye/rain.png',
        56: '/assets/images/skye/rain.png',
        57: '/assets/images/skye/rain.png',
        61: '/assets/images/skye/rain.png',
        63: '/assets/images/skye/rain.png',
        65: '/assets/images/skye/rain.png',
        66: '/assets/images/skye/rain.png',
        67: '/assets/images/skye/rain.png',
        71: '/assets/images/skye/snow.png',
        73: '/assets/images/skye/snow.png',
        75: '/assets/images/skye/snow.png',
        77: '/assets/images/skye/snow.png',
        80: '/assets/images/skye/rain.png',
        81: '/assets/images/skye/rain.png',
        82: '/assets/images/skye/rain.png',
        85: '/assets/images/skye/snow.png',
        86: '/assets/images/skye/snow.png',
        95: '/assets/images/skye/rain.png',
        96: '/assets/images/skye/rain.png',
        99: '/assets/images/skye/rain.png',
      };

      const weatherDescription = weatherDescriptions[currentWeatherCode] || "Unknown";
      const weatherImage = weatherMap[currentWeatherCode] || '/assets/images/skye/clear.png';

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

      const image = weatherBox.querySelector('img');
      image.src = weatherImage;
      description.innerHTML = weatherDescription;
      customMessage.innerHTML = tempMessage;
      temperature.innerHTML = `${Math.round(currentTemp)}<span>°C</span>`;
      humidity.innerHTML = `${Math.round(currentHumidity)}%`;
      wind.innerHTML = `${currentWindSpeed} m/s`;

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

fetchWeather(21.1608, 66.7752);