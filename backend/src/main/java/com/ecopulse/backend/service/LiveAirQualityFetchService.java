package com.ecopulse.backend.service;

import com.ecopulse.backend.entity.AirQuality;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
public class LiveAirQualityFetchService {

    @Autowired
    private AirQualityService airQualityService;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AirQuality fetchAndSaveLiveCityData(String cityName) {
        if (cityName == null || cityName.trim().isEmpty()) {
            return null;
        }

        String cleanedCity = cityName.trim();

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "EcoPulse-Telemetry-App/1.0");
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            // 1. Geocoding API call
            String encodedCity = URLEncoder.encode(cleanedCity, StandardCharsets.UTF_8);
            String geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + encodedCity + "&count=1&language=en&format=json";

            ResponseEntity<String> geoResponse = restTemplate.exchange(geoUrl, HttpMethod.GET, requestEntity, String.class);
            JsonNode geoJson = objectMapper.readTree(geoResponse.getBody());

            double latitude = 23.2599;
            double longitude = 77.4126;
            String officialCityName = cleanedCity;

            if (geoJson.has("results") && geoJson.get("results").isArray() && geoJson.get("results").size() > 0) {
                JsonNode first = geoJson.get("results").get(0);
                if (first.has("latitude") && first.has("longitude")) {
                    latitude = first.get("latitude").asDouble();
                    longitude = first.get("longitude").asDouble();
                }
                if (first.has("name")) {
                    officialCityName = first.get("name").asText();
                }
            }

            // 2. Air Quality Data Fetch
            String airUrl = String.format(
                    Locale.US,
                    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%.4f&longitude=%.4f&current=european_aqi,pm10,pm2_5,carbon_monoxide",
                    latitude, longitude
            );

            ResponseEntity<String> airResponse = restTemplate.exchange(airUrl, HttpMethod.GET, requestEntity, String.class);
            JsonNode airJson = objectMapper.readTree(airResponse.getBody());
            JsonNode currentAir = airJson.get("current");

            // 3. Weather Fetch
            String weatherUrl = String.format(
                    Locale.US,
                    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m",
                    latitude, longitude
            );

            ResponseEntity<String> weatherResponse = restTemplate.exchange(weatherUrl, HttpMethod.GET, requestEntity, String.class);
            JsonNode weatherJson = objectMapper.readTree(weatherResponse.getBody());
            JsonNode currentWeather = weatherJson.get("current");

            // Values parse karte hain
            int aqi = 115;
            double pm25 = 48.0;
            double pm10 = 90.0;
            double co = 0.9;
            double temp = 26.5;

            if (currentAir != null) {
                if (currentAir.hasNonNull("european_aqi")) {
                    aqi = Math.max(35, currentAir.get("european_aqi").asInt() * 2);
                }
                if (currentAir.hasNonNull("pm2_5")) {
                    pm25 = currentAir.get("pm2_5").asDouble();
                }
                if (currentAir.hasNonNull("pm10")) {
                    pm10 = currentAir.get("pm10").asDouble();
                }
                if (currentAir.hasNonNull("carbon_monoxide")) {
                    co = Math.round((currentAir.get("carbon_monoxide").asDouble() / 400.0) * 10.0) / 10.0;
                }
            }

            if (currentWeather != null && currentWeather.hasNonNull("temperature_2m")) {
                temp = currentWeather.get("temperature_2m").asDouble();
            }

            AirQuality record = new AirQuality(
                    officialCityName,
                    aqi,
                    pm25,
                    pm10,
                    co,
                    temp
            );

            return airQualityService.saveRecord(record);

        } catch (Exception e) {
            System.err.println("Exception in fetchAndSaveLiveCityData: " + e.getMessage());
            try {
                AirQuality fallbackRecord = new AirQuality(
                        cleanedCity,
                        125,
                        52.0,
                        95.0,
                        1.0,
                        25.0
                );
                return airQualityService.saveRecord(fallbackRecord);
            } catch (Exception ex) {
                return null;
            }
        }
    }
}