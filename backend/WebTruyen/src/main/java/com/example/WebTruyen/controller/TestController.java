package com.example.WebTruyen.controller;

import com.example.WebTruyen.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = {"http://localhost:5173"})
public class TestController {

    @GetMapping("/public")
    public String publicEndpoint() {
        return "This is a public endpoint - no authentication required";
    }

    @GetMapping("/protected")
    public String protectedEndpoint(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return "Hello " + userPrincipal.getUser().getUsername() + "! This is a protected endpoint.";
    }
}

@RestController
@CrossOrigin(origins = {"http://localhost:5173"})
class RootController {
    
    @GetMapping("/")
    public String root() {
        return "WebTruyen Backend API is running! Frontend should access API endpoints at /api/*";
    }
}
