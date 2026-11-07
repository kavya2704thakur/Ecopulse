package com.ecopulse.backend.service;

import com.ecopulse.backend.entity.AirQuality;
import com.ecopulse.backend.repository.AirQualityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AirQualityService {

    @Autowired
    private AirQualityRepository airQualityRepository;

    public AirQuality saveRecord(AirQuality airQuality) {
        airQuality.calculateStatusAndAdvisory();
        return airQualityRepository.save(airQuality);
    }

    public List<AirQuality> getAllRecords() {
        return airQualityRepository.findAll();
    }

    public Optional<AirQuality> getLatestByCity(String city) {
        return airQualityRepository.findFirstByCityIgnoreCaseOrderByRecordedAtDesc(city);
    }

    public List<AirQuality> getHistoryByCity(String city) {
        return airQualityRepository.findByCityIgnoreCaseOrderByRecordedAtDesc(city);
    }
}