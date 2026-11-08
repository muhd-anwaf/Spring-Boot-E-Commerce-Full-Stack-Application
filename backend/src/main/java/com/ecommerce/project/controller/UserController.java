package com.ecommerce.project.controller;

import com.ecommerce.project.config.AppConstants;
import com.ecommerce.project.payload.UpdateProfileRequest;
import com.ecommerce.project.payload.UpdateRolesRequest;
import com.ecommerce.project.payload.UserDTO;
import com.ecommerce.project.payload.UserResponse;
import com.ecommerce.project.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/users/me")
    public ResponseEntity<UserDTO> me() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PutMapping("/users/me")
    public ResponseEntity<UserDTO> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<UserResponse> getUsers(
            @RequestParam(name = "pageNumber", defaultValue = AppConstants.PAGE_NUMBER, required = false) Integer pageNumber,
            @RequestParam(name = "pageSize", defaultValue = "20", required = false) Integer pageSize) {
        return ResponseEntity.ok(userService.getAllUsers(pageNumber, pageSize));
    }

    @PutMapping("/admin/users/{userId}/roles")
    public ResponseEntity<UserDTO> updateRoles(@PathVariable Long userId, @Valid @RequestBody UpdateRolesRequest request) {
        return ResponseEntity.ok(userService.updateRoles(userId, request.getRoles()));
    }
}
