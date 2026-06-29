package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Address;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.AddressDTO;
import com.ecommerce.project.repositories.AddressRepository;
import com.ecommerce.project.repositories.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AddressServiceImpl implements AddressService {

    @Autowired
    UserRepository userRepository;


    @Autowired
    ModelMapper modelMapper;

    @Autowired
    AddressRepository addressRepository;


    @Override
    public AddressDTO createAddress(AddressDTO addressDTO, User user) {
        Address address = modelMapper.map(addressDTO,Address.class);
        List<Address> addressList = user.getAddresses();
        addressList.add(address);
        user.setAddresses(addressList);
        address.setUser(user);
        Address savedAddress = addressRepository.save(address);
        return modelMapper.map(savedAddress,AddressDTO.class);
    }

    @Override
    public List<AddressDTO> getAddress() {
        List<Address> addressList = addressRepository.findAll();
        return addressList.stream().map(add->modelMapper.map(add,AddressDTO.class)).collect(Collectors.toList());
    }

    @Override
    public Address getAddressById(Long addressId) {
        return addressRepository.findById(addressId).orElseThrow(
                ()-> new ResourceNotFoundException("address","addressId",addressId));
    }

    @Override
    public List<AddressDTO> getUserAddress(User user) {
        List<Address> addressList = user.getAddresses();
        return addressList.stream().map(add->modelMapper.map(add, AddressDTO.class)).collect(Collectors.toList());
    }

    @Override
    public Address updateAddress(Long addressId, AddressDTO addressDTO) {
        Address address = addressRepository.findById(addressId).orElseThrow(
                ()->new ResourceNotFoundException("address","addressId",addressId));
        address.setCity(addressDTO.getCity());
        address.setState(addressDTO.getState());
        address.setPincode(addressDTO.getPincode());
        address.setCountry(addressDTO.getCountry());
        address.setBuildingName(addressDTO.getBuildingName());

        Address updatedAddress = addressRepository.save(address);
        User user = address.getUser();
        user.getAddresses().removeIf(add-> add.getAddressId().equals(addressId));
        user.getAddresses().add(updatedAddress);
        userRepository.save(user);

        return updatedAddress;
    }

    @Override
    public String deleteAddressById(Long addressId) {
        Address address = addressRepository.findById(addressId).orElseThrow(
                ()->new ResourceNotFoundException("address","addressId",addressId));
        User user = address.getUser();
        user.getAddresses().removeIf(add->add.getAddressId().equals(addressId));
        userRepository.save(user);
        addressRepository.delete(address);

        return "address deleted successfully";
    }

}
