package com.ecopulse.backend.repository;

import com.ecopulse.backend.entity.AirQuality;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AirQualityRepository extends JpaRepository<AirQuality, Long> {
    List<AirQuality> findByCityIgnoreCaseOrderByRecordedAtDesc(String city);
    Optional<AirQuality> findFirstByCityIgnoreCaseOrderByRecordedAtDesc(String city);
}