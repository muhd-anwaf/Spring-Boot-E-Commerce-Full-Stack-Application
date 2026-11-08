package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.UpdateProfileRequest;
import com.ecommerce.project.payload.UserDTO;
import com.ecommerce.project.payload.UserResponse;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import com.ecommerce.project.util.AuthUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthUtil authUtil;

    @Override
    @Transactional(readOnly = true)
    public UserDTO getCurrentUser() {
        return toDto(authUtil.loggedInUser());
    }

    @Override
    @Transactional
    public UserDTO updateProfile(UpdateProfileRequest request) {
        User user = authUtil.loggedInUser();

        String email = request.getEmail().trim();
        if (!email.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new APIException("Email is already in use");
        }
        user.setEmail(email);

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            if (request.getCurrentPassword() == null
                    || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new APIException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }
        return toDto(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getAllUsers(Integer pageNumber, Integer pageSize) {
        if (pageNumber == null || pageNumber < 0 || pageSize == null || pageSize < 1 || pageSize > 100) {
            throw new APIException("pageNumber must be 0 or greater and pageSize between 1 and 100");
        }
        Page<User> page = userRepository.findAll(PageRequest.of(pageNumber, pageSize, Sort.by("userId")));
        UserResponse response = new UserResponse();
        response.setContent(page.getContent().stream().map(this::toDto).toList());
        response.setPageNumber(page.getNumber());
        response.setPageSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setLastPage(page.isLast());
        return response;
    }

    @Override
    @Transactional
    public UserDTO updateRoles(Long userId, Set<String> roleNames) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "userId", userId));

        Set<Role> roles = new HashSet<>();
        for (String name : roleNames) {
            AppRole appRole;
            try {
                appRole = AppRole.valueOf(name.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new APIException("Unknown role: " + name);
            }
            roles.add(roleRepository.findByRoleName(appRole)
                    .orElseThrow(() -> new APIException("Role not found: " + name)));
        }

        boolean losesAdmin = roles.stream().noneMatch(r -> r.getRoleName() == AppRole.ROLE_ADMIN);
        if (losesAdmin && user.getUserId().equals(authUtil.loggedInUserId())) {
            throw new APIException("You cannot remove your own admin role");
        }
        user.setRoles(roles);
        return toDto(userRepository.save(user));
    }

    private UserDTO toDto(User user) {
        return new UserDTO(user.getUserId(), user.getUserName(), user.getEmail(),
                user.getRoles().stream().map(r -> r.getRoleName().name()).sorted().toList());
    }
}
