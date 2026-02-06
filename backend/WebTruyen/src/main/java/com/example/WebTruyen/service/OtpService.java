package com.example.WebTruyen.service;

import org.apache.commons.text.RandomStringGenerator;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class OtpService {
    
    private final RandomStringGenerator generator;
    
    public OtpService() {
        this.generator = new RandomStringGenerator.Builder()
                .withinRange('0', '9')
                .usingRandom(new SecureRandom()::nextInt)
                .build();
    }
    
    public String generateOtp() {
        return generator.generate(6);
    }
    
    public boolean validateOtp(String inputOtp, String storedOtp) {
        return inputOtp != null && storedOtp != null && inputOtp.equals(storedOtp);
    }
}
