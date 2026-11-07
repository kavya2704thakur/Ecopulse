package com.ecopulse.backend.service;

import com.ecopulse.backend.entity.AirQuality;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class AirQualitySchedulerService {

    private static final Logger log = LoggerFactory.getLogger(AirQualitySchedulerService.class);
    private final Random random = new Random();

    @Autowired
    private AirQualityService airQualityService;

    // Har 60 second (1 minute) me automatic data generate aur persist hoga
    @Scheduled(fixedRate = 60000)
    public void generateLiveReading() {
        int aqi = 110 + random.nextInt(60); // 110 to 170
        double pm25 = Math.round((35.0 + (aqi * 0.25) + (random.nextDouble() * 5)) * 10.0) / 10.0;
        double pm10 = Math.round((70.0 + (aqi * 0.45) + (random.nextDouble() * 8)) * 10.0) / 10.0;
        double co = Math.round((0.8 + (random.nextDouble() * 0.8)) * 10.0) / 10.0;
        double temperature = Math.round((24.0 + (random.nextDouble() * 4.5)) * 10.0) / 10.0;

        AirQuality reading = new AirQuality();
        reading.setCity("Bhopal");
        reading.setAqi(aqi);
        reading.setPm25(pm25);
        reading.setPm10(pm10);
        reading.setCo(co);
        reading.setTemperature(temperature);

        AirQuality saved = airQualityService.saveRecord(reading);
        log.info("Auto-logged live air quality telemetry: City={}, AQI={}, Status={}", 
                saved.getCity(), saved.getAqi(), saved.getStatus());
    }
}