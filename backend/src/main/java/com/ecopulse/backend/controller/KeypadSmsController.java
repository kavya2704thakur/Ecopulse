package com.ecopulse.backend.controller;

import com.ecopulse.backend.repository.KeypadUserRepository;
import com.ecopulse.backend.service.KeypadSmsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/sms")
@CrossOrigin(origins = {"http://localhost:5173", "https://ecopulse-six-silk.vercel.app"})
public class KeypadSmsController {

    @Autowired
    private KeypadSmsService keypadSmsService;

    @Autowired
    private KeypadUserRepository keypadUserRepository;

    @PostMapping("/inbound")
    public ResponseEntity<?> receiveSms(
            @RequestParam(name = "from") String from,
            @RequestParam(name = "body") String body) {
        String reply = keypadSmsService.handleIncomingSms(from, body);
        Map<String, String> response = new HashMap<>();
        response.put("sender", from);
        response.put("incomingCommand", body);
        response.put("smsResponse", reply);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/trigger-morning-blast")
    public ResponseEntity<String> triggerMorningBlast() {
        keypadSmsService.sendMorningSmsAlerts();
        return ResponseEntity.ok("Morning SMS blast executed for all registered keypad numbers!");
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getSubscriberStats() {
        long keypadCount = keypadUserRepository.count();
        long webUsersCount = 1;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSubscribers", keypadCount + webUsersCount);
        stats.put("keypadUsers", keypadCount);
        stats.put("webUsers", webUsersCount);

        return ResponseEntity.ok(stats);
    }
}