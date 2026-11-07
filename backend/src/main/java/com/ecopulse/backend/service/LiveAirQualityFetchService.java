package com.ecopulse.backend.service;

import com.ecopulse.backend.entity.AirQuality;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class LiveAirQualityFetchService {

    @Autowired
    private AirQualityService airQualityService;

    private final RestTemplate restTemplate = new RestTemplate();

    public AirQuality fetchAndSaveLiveCityData(String cityName) {
        try {
            // 1. City encode karke Lat/Lon fetch karte hain
            String encodedCity = URLEncoder.encode(cityName.trim(), StandardCharsets.UTF_8);
            String geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodedCity + "&count=1&language=en&format=json";
            
            Map<?, ?> geoResponse = restTemplate.getForObject(geoUrl, Map.class);

            if (geoResponse == null || !geoResponse.containsKey("results")) {
                return null;
            }

            List<?> results = (List<?>) geoResponse.get("results");
            if (results == null || results.isEmpty()) {
                return null;
            }

            Map<?, ?> firstResult = (Map<?, ?>) results.get(0);
            double latitude = ((Number) firstResult.get("latitude")).doubleValue();
            double longitude = ((Number) firstResult.get("longitude")).doubleValue();
            String officialCityName = (String) firstResult.get("name");

            // 2. Real-time live Air Quality mangwate hain
            String airUrl = String.format(
                    Locale.US,
                    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%.4f&longitude=%.4f&current=european_aqi,pm10,pm2_5,carbon_monoxide",
                    latitude, longitude
            );
            Map<?, ?> airResponse = restTemplate.getForObject(airUrl, Map.class);
            Map<?, ?> currentAir = airResponse != null ? (Map<?, ?>) airResponse.get("current") : null;

            // 3. Current Temperature fetch karte hain
            String weatherUrl = String.format(
                    Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m",
                    latitude, longitude
            );
            Map<?, ?> weatherResponse = restTemplate.getForObject(weatherUrl, Map.class);
            Map<?, ?> currentWeather = weatherResponse != null ? (Map<?, ?>) weatherResponse.get("current") : null;

            // Values extract karte hain
            int aqi = 110;
            double pm25 = 45.0;
            double pm10 = 85.0;
            double co = 0.9;
            double temp = 26.0;

            if (currentAir != null) {
                if (currentAir.get("european_aqi") != null) {
                    aqi = Math.max(30, ((Number) currentAir.get("european_aqi")).intValue() * 2);
                }
                if (currentAir.get("pm2_5") != null) {
                    pm25 = ((Number) currentAir.get("pm2_5")).doubleValue();
                }
                if (currentAir.get("pm10") != null) {
                    pm10 = ((Number) currentAir.get("pm10")).doubleValue();
                }
                if (currentAir.get("carbon_monoxide") != null) {
                    co = Math.round((((Number) currentAir.get("carbon_monoxide")).doubleValue() / 400.0) * 10.0) / 10.0;
                }
            }

            if (currentWeather != null && currentWeather.get("temperature_2m") != null) {
                temp = ((Number) currentWeather.get("temperature_2m")).doubleValue();
            }

            // AirQuality entity ka parameterized constructor call karte hain
            // Yeh constructor status, advisory aur recordedAt sab khud set karta hai
            AirQuality record = new AirQuality(
                    officialCityName != null ? officialCityName : cityName,
                    aqi,
                    pm25,
                    pm10,
                    co,
                    temp
            );

            return airQualityService.saveRecord(record);

        } catch (Exception e) {
            System.err.println("Error fetching live air quality for city: " + cityName + " -> " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}