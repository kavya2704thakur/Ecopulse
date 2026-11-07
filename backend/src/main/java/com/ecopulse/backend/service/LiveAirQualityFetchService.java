package com.ecopulse.backend.service;

import com.ecopulse.backend.entity.AirQuality;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class LiveAirQualityFetchService {

    @Autowired
    private AirQualityService airQualityService;

    private final RestTemplate restTemplate = new RestTemplate();

    public AirQuality fetchAndSaveLiveCityData(String cityName) {
        try {
            // 1. City ka Latitude aur Longitude nikaalte hain (Free Geocoding API)
            String geoUrl = "https://geocoding-api.open-meteo.com/v1/search?name=" + cityName + "&count=1&language=en&format=json";
            Map<?, ?> geoResponse = restTemplate.getForObject(geoUrl, Map.class);

            if (geoResponse == null || !geoResponse.containsKey("results")) {
                return null;
            }

            List<?> results = (List<?>) geoResponse.get("results");
            if (results.isEmpty()) {
                return null;
            }

            Map<?, ?> firstResult = (Map<?, ?>) results.get(0);
            double latitude = ((Number) firstResult.get("latitude")).doubleValue();
            double longitude = ((Number) firstResult.get("longitude")).doubleValue();
            String officialCityName = (String) firstResult.get("name");

            // 2. Real-time live Air Quality & Weather data mangwate hain
            String airUrl = String.format(
                    "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=%f&longitude=%f&current=european_aqi,pm10,pm2_5,carbon_monoxide",
                    latitude, longitude
            );
            Map<?, ?> airResponse = restTemplate.getForObject(airUrl, Map.class);
            Map<?, ?> currentAir = (Map<?, ?>) airResponse.get("current");

            // 3. Current Temperature fetch karte hain
            String weatherUrl = String.format(
                    "https://api.open-meteo.com/v1/forecast?latitude=%f&longitude=%f&current=temperature_2m",
                    latitude, longitude
            );
            Map<?, ?> weatherResponse = restTemplate.getForObject(weatherUrl, Map.class);
            Map<?, ?> currentWeather = (Map<?, ?>) weatherResponse.get("current");

            // Values extract karte hain
            int aqi = currentAir.get("european_aqi") != null ? ((Number) currentAir.get("european_aqi")).intValue() * 2 : 100;
            double pm25 = currentAir.get("pm2_5") != null ? ((Number) currentAir.get("pm2_5")).doubleValue() : 35.0;
            double pm10 = currentAir.get("pm10") != null ? ((Number) currentAir.get("pm10")).doubleValue() : 70.0;
            double co = currentAir.get("carbon_monoxide") != null ? Math.round((((Number) currentAir.get("carbon_monoxide")).doubleValue() / 400.0) * 10.0) / 10.0 : 0.8;
            double temp = currentWeather.get("temperature_2m") != null ? ((Number) currentWeather.get("temperature_2m")).doubleValue() : 25.0;

            // Database entity banakar save karte hain
            AirQuality record = new AirQuality();
            record.setCity(officialCityName);
            record.setAqi(aqi);
            record.setPm25(pm25);
            record.setPm10(pm10);
            record.setCo(co);
            record.setTemperature(temp);

            return airQualityService.saveRecord(record);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}