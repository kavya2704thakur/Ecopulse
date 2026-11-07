package com.ecopulse.backend.service;

import com.ecopulse.backend.entity.AirQuality;
import com.ecopulse.backend.entity.KeypadUser;
import com.ecopulse.backend.repository.KeypadUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class KeypadSmsService {

    @Autowired
    private KeypadUserRepository keypadUserRepository;

    @Autowired
    private LiveAirQualityFetchService liveAirQualityFetchService;

    // Inbound SMS Registration: e.g. "JOIN BHOPAL ASTHMA"
    public String handleIncomingSms(String phoneNumber, String messageBody) {
        if (messageBody == null || messageBody.trim().isEmpty()) {
            return "EcoPulse: Invalid command. Reply with JOIN <CITY> <CONDITION>. Example: JOIN BHOPAL ASTHMA";
        }

        String[] tokens = messageBody.trim().split("\\s+");
        String command = tokens[0].toUpperCase();

        if ("JOIN".equals(command)) {
            if (tokens.length < 2) {
                return "EcoPulse: Missing details. Send: JOIN <CITY> <CONDITION> (Conditions: ASTHMA, ALLERGY, HEART, NONE)";
            }

            String city = tokens[1].substring(0, 1).toUpperCase() + tokens[1].substring(1).toLowerCase();
            String condition = tokens.length >= 3 ? tokens[2].toUpperCase() : "NONE";

            Optional<KeypadUser> existing = keypadUserRepository.findByPhoneNumber(phoneNumber);
            KeypadUser user = existing.orElseGet(KeypadUser::new);
            user.setPhoneNumber(phoneNumber);
            user.setCity(city);
            user.setCondition(condition);
            keypadUserRepository.save(user);

            String confirmationMsg = "EcoPulse: Registration successful for " + city + " (" + condition + "). Daily 6:30 AM alerts activated!";
            dispatchSms(phoneNumber, confirmationMsg);
            return confirmationMsg;
        } else if ("STOP".equals(command)) {
            keypadUserRepository.findByPhoneNumber(phoneNumber).ifPresent(keypadUserRepository::delete);
            String byeMsg = "EcoPulse: You have been unsubscribed from daily SMS alerts.";
            dispatchSms(phoneNumber, byeMsg);
            return byeMsg;
        }

        return "EcoPulse Help: Send 'JOIN <CITY> <CONDITION>' to subscribe or 'STOP' to cancel alerts.";
    }

    // Har subah 6:30 AM par sabhi keypad users ko SMS send karne ka Cron Scheduler
    @Scheduled(cron = "0 30 6 * * ?")
    public void sendMorningSmsAlerts() {
        List<KeypadUser> users = keypadUserRepository.findAll();
        for (KeypadUser user : users) {
            try {
                AirQuality data = liveAirQualityFetchService.fetchAndSaveLiveCityData(user.getCity());
                if (data != null) {
                    String advisory = generateConditionAdvisory(user.getCondition(), data.getAqi());
                    String smsContent = String.format(
                        "EcoPulse 6:30 AM Alert: %s AQI is %d (%s), Temp: %.1fC. Advisory: %s",
                        data.getCity(), data.getAqi(), data.getStatus(), data.getTemperature(), advisory
                    );
                    dispatchSms(user.getPhoneNumber(), smsContent);
                }
            } catch (Exception e) {
                System.err.println("Failed to send daily SMS to " + user.getPhoneNumber() + ": " + e.getMessage());
            }
        }
    }

    public String generateConditionAdvisory(String condition, int aqi) {
        if ("ASTHMA".equalsIgnoreCase(condition)) {
            return aqi > 100 ? "High risk. Keep inhaler ready and avoid early morning exposure." : "Air quality is fair. Inhaler on standby.";
        } else if ("ALLERGY".equalsIgnoreCase(condition) || "DUST ALLERGY".equalsIgnoreCase(condition)) {
            return aqi > 80 ? "High particulate dust. Cover face or wear mask outdoors." : "Dust levels moderate.";
        } else if ("HEART".equalsIgnoreCase(condition)) {
            return aqi > 120 ? "High stress air. Avoid intense physical activity outside." : "Safe for normal walking.";
        }
        return "Air quality monitored. Stay safe!";
    }

    // Telecom Gateway Simulation Logger
    public void dispatchSms(String phoneNumber, String message) {
        System.out.println("=================================================");
        System.out.println("[GSM TELECOM GATEWAY: OUTBOUND SMS DELIVERED]");
        System.out.println("DEVICE: Keypad Feature Phone (GSM 2G/3G Band)");
        System.out.println("TO: +91 " + phoneNumber);
        System.out.println("MESSAGE: " + message);
        System.out.println("STATUS: 200 OK (DELIVERED)");
        System.out.println("=================================================");
    }
}