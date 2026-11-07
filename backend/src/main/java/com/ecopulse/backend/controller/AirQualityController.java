package com.ecopulse.backend.controller;

import com.ecopulse.backend.entity.AirQuality;
import com.ecopulse.backend.service.AirQualityService;
import com.ecopulse.backend.service.LiveAirQualityFetchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/air-quality")
@CrossOrigin(origins = "http://localhost:5173")
public class AirQualityController {

    @Autowired
    private AirQualityService airQualityService;

    @Autowired
    private LiveAirQualityFetchService liveAirQualityFetchService;

    @PostMapping
    public ResponseEntity<AirQuality> addAirQuality(@RequestBody AirQuality airQuality) {
        return ResponseEntity.ok(airQualityService.saveRecord(airQuality));
    }

    @GetMapping("/latest")
    public ResponseEntity<AirQuality> getLatestAirQuality(@RequestParam String city) {
        Optional<AirQuality> record = airQualityService.getLatestByCity(city);
        
        // Agar database me nahi hai, toh seedha Internet/Satellite API se fetch karo
        if (record.isEmpty()) {
            AirQuality liveData = liveAirQualityFetchService.fetchAndSaveLiveCityData(city);
            if (liveData != null) {
                return ResponseEntity.ok(liveData);
            }
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(record.get());
    }

    @GetMapping("/history")
    public ResponseEntity<List<AirQuality>> getHistory(@RequestParam String city) {
        List<AirQuality> history = airQualityService.getHistoryByCity(city);
        
        // Agar history khali hai toh ek reading live laa kar save kar do
        if (history.isEmpty()) {
            AirQuality liveData = liveAirQualityFetchService.fetchAndSaveLiveCityData(city);
            if (liveData != null) {
                history = List.of(liveData);
            }
        }
        return ResponseEntity.ok(history);
    }

    @GetMapping("/all")
    public ResponseEntity<List<AirQuality>> getAllData() {
        return ResponseEntity.ok(airQualityService.getAllRecords());
    }
}