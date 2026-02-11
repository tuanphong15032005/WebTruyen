package com.example.WebTruyen.service;

public class AccountLockedException extends RuntimeException {

    private final long secondsRemaining;

    public AccountLockedException(String message, long secondsRemaining) {
        super(message);
        this.secondsRemaining = secondsRemaining;
    }

    public long getSecondsRemaining() {
        return secondsRemaining;
    }
}
