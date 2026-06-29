package com.ecommerce.project.service;

import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.AddressDTO;
import com.ecommerce.project.model.Address;

import java.util.List;


public interface AddressService {
    AddressDTO createAddress(AddressDTO addressDTO, User user);

    List<AddressDTO> getAddress();

    Address getAddressById(Long addressId);

    List<AddressDTO> getUserAddress(User user);

    Address updateAddress(Long addressId, AddressDTO addressDTO);

    String deleteAddressById(Long addressId);
}
