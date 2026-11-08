package com.ecommerce.project.exceptions;

import com.ecommerce.project.payload.APIResponse;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Maps exceptions to the single error shape {@code {message, status:false, errors?}}.
 */
@RestControllerAdvice
public class MyGlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(MyGlobalExceptionHandler.class);

    private ResponseEntity<APIResponse> build(HttpStatus status, String message) {
        return new ResponseEntity<>(new APIResponse(message, false), status);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getAllErrors().forEach(err -> {
            String field = err instanceof FieldError fe ? fe.getField() : err.getObjectName();
            errors.putIfAbsent(field, err.getDefaultMessage());
        });
        return new ResponseEntity<>(new APIResponse("Validation failed", false, errors), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<APIResponse> handleConstraint(ConstraintViolationException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getConstraintViolations().forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        return new ResponseEntity<>(new APIResponse("Validation failed", false, errors), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<APIResponse> handleNotFound(ResourceNotFoundException e) {
        return build(HttpStatus.NOT_FOUND, e.getMessage());
    }

    @ExceptionHandler(APIException.class)
    public ResponseEntity<APIResponse> handleApi(APIException e) {
        return build(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    public ResponseEntity<APIResponse> handleBadRequest(Exception e) {
        return build(HttpStatus.BAD_REQUEST, "Malformed or incomplete request");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<APIResponse> handleAuthentication(AuthenticationException e) {
        return build(HttpStatus.UNAUTHORIZED, "Authentication is required to access this resource");
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<APIResponse> handleAccessDenied(AccessDeniedException e) {
        return build(HttpStatus.FORBIDDEN, "You do not have permission to perform this action");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<APIResponse> handleIntegrity(DataIntegrityViolationException e) {
        logger.warn("Data integrity violation: {}", e.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "The request conflicts with existing data");
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<APIResponse> handleUploadSize(MaxUploadSizeExceededException e) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "The uploaded file is too large");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<APIResponse> handleNoResource(NoResourceFoundException e) {
        return build(HttpStatus.NOT_FOUND, "Resource not found");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<APIResponse> handleMethod(HttpRequestMethodNotSupportedException e) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "HTTP method not supported for this endpoint");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<APIResponse> handleMediaType(HttpMediaTypeNotSupportedException e) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<APIResponse> handleUnexpected(Exception e) {
        logger.error("Unexpected error", e);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong. Please try again later.");
    }
}
