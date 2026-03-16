package com.example.WebTruyen.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class VNPayService {

    @Value("${vnpay.pay.url}")
    private String vnpayPayUrl;

    @Value("${vnpay.return.url}")
    private String vnpayReturnUrl;

    @Value("${vnpay.tmn.code}")
    private String vnpayTmnCode;

    @Value("${vnpay.hash.secret}")
    private String vnpayHashSecret;

    @Value("${vnpay.version}")
    private String vnpayVersion;

    @Value("${vnpay.command}")
    private String vnpayCommand;

    @Value("${vnpay.curr.code}")
    private String vnpayCurrCode;

    public String createPaymentUrl(Long orderId, Long amountInVnd, String orderInfo) {
        try {
            log.info("Creating VNPay payment URL - orderId: {}, amount: {}", orderId, amountInVnd);
            
            // Log configuration values
            log.info("VNPay Config - URL: {}, TMN: {}, Version: {}, Command: {}", 
                    vnpayPayUrl, vnpayTmnCode, vnpayVersion, vnpayCommand);
            
            if (vnpayPayUrl == null || vnpayTmnCode == null || vnpayHashSecret == null) {
                log.error("VNPay configuration is missing - URL: {}, TMN: {}, Secret: {}", 
                        vnpayPayUrl, vnpayTmnCode, vnpayHashSecret);
                throw new RuntimeException("VNPay configuration is missing");
            }
            
            String vnp_Version = vnpayVersion;
            String vnp_Command = vnpayCommand;
            String vnp_TmnCode = vnpayTmnCode;
            long amount = amountInVnd * 100; // Convert to VND * 100
            String vnp_CurrCode = vnpayCurrCode;
            String vnp_TxnRef = String.valueOf(orderId);
            String vnp_OrderInfo = orderInfo;
            String vnp_Locale = "vn";
            String vnp_ReturnUrl = vnpayReturnUrl;
            String vnp_IpAddr = "127.0.0.1"; // In production, get real IP
            String vnp_BankCode = ""; // Optional: Bank code
            String vnp_BankTranNo = ""; // Optional: Bank transaction number

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
            String vnp_CreateDate = LocalDateTime.now().format(formatter);
            String vnp_ExpireDate = LocalDateTime.now().plusMinutes(15).format(formatter);

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount));
            vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
            vnp_Params.put("vnp_OrderType", "250000"); // Required: Order type
            vnp_Params.put("vnp_Locale", vnp_Locale);
            vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // Build query string
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }

            String vnp_SecureHash;
            try {
                vnp_SecureHash = hmacSHA512(vnpayHashSecret, hashData.toString());
            } catch (Exception hashException) {
                log.error("Error creating HMAC hash", hashException);
                throw new RuntimeException("Failed to create payment hash", hashException);
            }
            query.append("&vnp_SecureHash=").append(vnp_SecureHash);

            String fullUrl = vnpayPayUrl + "?" + query.toString();
            log.info("Generated VNPay URL: {}", fullUrl);
            log.info("Hash data: {}", hashData.toString());
            log.info("Parameters: {}", vnp_Params);
            
            return fullUrl;
        } catch (Exception e) {
            log.error("Error creating VNPay payment URL", e);
            throw new RuntimeException("Failed to create payment URL", e);
        }
    }

    public boolean validateReturnUrl(Map<String, String> params) {
        try {
            String vnp_SecureHash = params.get("vnp_SecureHash");
            if (vnp_SecureHash == null) {
                log.warn("No vnp_SecureHash found in return parameters");
                return false;
            }

            log.info("VNPay return validation - Original hash: {}", vnp_SecureHash);

            // Remove secure hash from params for validation
            Map<String, String> vnp_Params = new HashMap<>(params);
            vnp_Params.remove("vnp_SecureHash");
            vnp_Params.remove("vnp_SecureHashType");

            // Sort and build hash data - same logic as createPaymentUrl
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8));
                    if (itr.hasNext()) {
                        hashData.append('&');
                    }
                }
            }

            String calculatedHash = hmacSHA512(vnpayHashSecret, hashData.toString());
            
            log.info("VNPay return validation - Calculated hash: {}", calculatedHash);
            log.info("VNPay return validation - Hash data: {}", hashData.toString());
            log.info("VNPay return validation - Hash match: {}", vnp_SecureHash.equals(calculatedHash));
            
            return vnp_SecureHash.equals(calculatedHash);
        } catch (Exception e) {
            log.error("Error validating VNPay return URL", e);
            return false;
        }
    }

    private String hmacSHA512(String key, String data) throws Exception {
        Mac hmac512 = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        hmac512.init(secretKey);
        byte[] hashBytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
