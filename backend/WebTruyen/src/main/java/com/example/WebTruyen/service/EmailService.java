package com.example.WebTruyen.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendVerificationEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("WebTruyen <noreply@webtruyen.com>");
        message.setTo(toEmail);
        message.setSubject("Mã xác thực đăng ký WebTruyen");
        message.setText("Xin chào,\n\nMã xác thực của bạn là: " + code + "\n\nVui lòng không chia sẻ mã này cho ai.");

        mailSender.send(message);
    }
    
    public void sendOtpEmail(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác thực tài khoản WebTruyen");
        message.setText("Mã OTP của bạn là: " + otp + "\n\nMã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này với người khác.");
        
        mailSender.send(message);
    }
}
