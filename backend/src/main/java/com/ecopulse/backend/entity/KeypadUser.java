package com.ecopulse.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "keypad_users")
public class KeypadUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String phoneNumber;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private String condition; // e.g. ASTHMA, ALLERGY, HEART, NONE

    private LocalDateTime registeredAt = LocalDateTime.now();

    public KeypadUser() {}

    public KeypadUser(String phoneNumber, String city, String condition) {
        this.phoneNumber = phoneNumber;
        this.city = city;
        this.condition = condition;
        this.registeredAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }
}