package com.ecommerce.project.security.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserInfoResponse {
    private Long id;
    private String username;
    private String email;
    private List<String> roles;
    /** Raw JWT, only returned by sign-in. */
    private String jwtToken;

    public UserInfoResponse(Long id, String username, String email, List<String> roles, String jwtToken) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.jwtToken = jwtToken;
    }

    public UserInfoResponse(Long id, String username, String email, List<String> roles) {
        this(id, username, email, roles, null);
    }
}
