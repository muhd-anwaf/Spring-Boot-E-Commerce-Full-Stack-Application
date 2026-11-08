package com.ecommerce.project.payload;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/** Standard envelope for error and message responses: {message, status, errors?}. */
@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class APIResponse {
    private String message;
    private boolean status;
    private Map<String, String> errors;

    public APIResponse(String message, boolean status) {
        this.message = message;
        this.status = status;
    }

    public APIResponse(String message, boolean status, Map<String, String> errors) {
        this(message, status);
        this.errors = errors;
    }
}
