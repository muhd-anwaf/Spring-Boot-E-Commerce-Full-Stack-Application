package com.ecommerce.project.service;

import com.ecommerce.project.payload.UpdateProfileRequest;
import com.ecommerce.project.payload.UserDTO;
import com.ecommerce.project.payload.UserResponse;

import java.util.Set;

public interface UserService {
    UserDTO getCurrentUser();

    UserDTO updateProfile(UpdateProfileRequest request);

    UserResponse getAllUsers(Integer pageNumber, Integer pageSize);

    UserDTO updateRoles(Long userId, Set<String> roleNames);
}
