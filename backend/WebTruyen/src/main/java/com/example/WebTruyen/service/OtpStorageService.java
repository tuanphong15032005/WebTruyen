package com.example.WebTruyen.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpStorageService {
    
    private final ConcurrentHashMap<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    
    private static class OtpData {
        private final String otp;
        private final LocalDateTime expiryTime;
        
        public OtpData(String otp, LocalDateTime expiryTime) {
            this.otp = otp;
            this.expiryTime = expiryTime;
        }
        
        public String getOtp() { return otp; }
        public LocalDateTime getExpiryTime() { return expiryTime; }
    }
    
    public void storeOtp(String email, String otp) {
        LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(5);
        otpStorage.put(email, new OtpData(otp, expiryTime));
    }
    
    public boolean validateOtp(String email, String inputOtp) {
        OtpData otpData = otpStorage.get(email);
        if (otpData == null) {
            return false;
        }
        
        if (LocalDateTime.now().isAfter(otpData.getExpiryTime())) {
            otpStorage.remove(email);
            return false;
        }
        
        return inputOtp.equals(otpData.getOtp());
    }
    
    public void removeOtp(String email) {
        otpStorage.remove(email);
    }
}
