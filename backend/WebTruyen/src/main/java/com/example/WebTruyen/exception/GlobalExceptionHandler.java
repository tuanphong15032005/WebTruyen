//package com.example.WebTruyen.exception;
//
//import org.springframework.http.HttpStatus;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.AccessDeniedException;
//import org.springframework.security.core.AuthenticationException;
//import org.springframework.validation.FieldError;
//import org.springframework.web.bind.MethodArgumentNotValidException;
//import org.springframework.web.bind.annotation.ExceptionHandler;
//import org.springframework.web.bind.annotation.RestControllerAdvice;
//import org.springframework.web.context.request.WebRequest;
//
//import java.util.HashMap;
//import java.util.Map;
//
//@RestControllerAdvice
//public class GlobalExceptionHandler {
//
//    @ExceptionHandler(ResourceNotFoundException.class)
//    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(
//            ResourceNotFoundException ex, WebRequest request) {
//        return ResponseEntity.status(HttpStatus.NOT_FOUND)
//                .body(ApiResponse.error(HttpStatus.NOT_FOUND, ex.getMessage()));
//    }
//
//    @ExceptionHandler(BusinessException.class)
//    public ResponseEntity<ApiResponse<Object>> handleBusinessException(
//            BusinessException ex, WebRequest request) {
//        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                .body(ApiResponse.error(HttpStatus.BAD_REQUEST, ex.getMessage()));
//    }
//
//    @ExceptionHandler(AccessDeniedException.class)
//    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(
//            AccessDeniedException ex, WebRequest request) {
//        return ResponseEntity.status(HttpStatus.FORBIDDEN)
//                .body(ApiResponse.error(HttpStatus.FORBIDDEN, "You don't have permission to perform this action"));
//    }
//
//    @ExceptionHandler(AuthenticationException.class)
//    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(
//            AuthenticationException ex, WebRequest request) {
//        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
//                .body(ApiResponse.error(HttpStatus.UNAUTHORIZED, "Authentication failed"));
//    }
//
//    @ExceptionHandler(MethodArgumentNotValidException.class)
//    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(
//            MethodArgumentNotValidException ex) {
//        Map<String, String> errors = new HashMap<>();
//        ex.getBindingResult().getAllErrors().forEach((error) -> {
//            String fieldName = ((FieldError) error).getField();
//            String errorMessage = error.getDefaultMessage();
//            errors.put(fieldName, errorMessage);
//        });
//        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
//                .body(ApiResponse.error(HttpStatus.BAD_REQUEST, "Validation failed: " + errors));
//    }
//
//    @ExceptionHandler(Exception.class)
//    public ResponseEntity<ApiResponse<Object>> handleGlobalException(
//            Exception ex, WebRequest request) {
//        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
//                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred"));
//    }
//}
