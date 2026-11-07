package com.ecopulse.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "air_quality_records")
public class AirQuality {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String city;

    private int aqi;
    private double pm25;
    private double pm10;
    private double co;
    private double temperature;

    private String status;
    private String advisory;

    private LocalDateTime recordedAt = LocalDateTime.now();

    public AirQuality() {}

    public AirQuality(String city, int aqi, double pm25, double pm10, double co, double temperature) {
        this.city = city;
        this.aqi = aqi;
        this.pm25 = pm25;
        this.pm10 = pm10;
        this.co = co;
        this.temperature = temperature;
        this.recordedAt = LocalDateTime.now();
        calculateStatusAndAdvisory();
    }

    public void calculateStatusAndAdvisory() {
        if (this.aqi <= 50) {
            this.status = "Good";
            this.advisory = "Air quality is satisfactory. Enjoy outdoor activities!";
        } else if (this.aqi <= 100) {
            this.status = "Moderate";
            this.advisory = "Air quality is acceptable. Sensitive individuals should take care.";
        } else if (this.aqi <= 200) {
            this.status = "Poor";
            this.advisory = "Wear masks outdoors and avoid strenuous exertion.";
        } else if (this.aqi <= 300) {
            this.status = "Unhealthy";
            this.advisory = "Health alert: Everyone may begin to experience adverse effects.";
        } else {
            this.status = "Severe";
            this.advisory = "Emergency conditions: Remain indoors and run air purifiers.";
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public int getAqi() { return aqi; }
    public void setAqi(int aqi) { 
        this.aqi = aqi; 
        calculateStatusAndAdvisory();
    }

    public double getPm25() { return pm25; }
    public void setPm25(double pm25) { this.pm25 = pm25; }

    public double getPm10() { return pm10; }
    public void setPm10(double pm10) { this.pm10 = pm10; }

    public double getCo() { return co; }
    public void setCo(double co) { this.co = co; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public String getStatus() { return status; }
    public String getAdvisory() { return advisory; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}