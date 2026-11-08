package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Address;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.AddressDTO;
import com.ecommerce.project.repositories.AddressRepository;
import com.ecommerce.project.repositories.OrderRepository;
import com.ecommerce.project.util.AuthUtil;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AddressServiceImpl implements AddressService {

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private AuthUtil authUtil;

    @Override
    @Transactional
    public AddressDTO createAddress(AddressDTO addressDTO, User user) {
        Address address = new Address();
        copyFields(address, addressDTO);
        address.setUser(user);
        return modelMapper.map(addressRepository.save(address), AddressDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressDTO> getUserAddresses(User user) {
        return addressRepository.findByUserUserId(user.getUserId()).stream()
                .map(address -> modelMapper.map(address, AddressDTO.class))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AddressDTO getAddressesById(Long addressId) {
        return modelMapper.map(findOwned(addressId), AddressDTO.class);
    }

    @Override
    @Transactional
    public AddressDTO updateAddress(Long addressId, AddressDTO addressDTO) {
        Address address = findOwned(addressId);
        copyFields(address, addressDTO);
        return modelMapper.map(addressRepository.save(address), AddressDTO.class);
    }

    @Override
    @Transactional
    public String deleteAddress(Long addressId) {
        Address address = findOwned(addressId);
        if (orderRepository.existsByAddressAddressId(addressId)) {
            throw new APIException("This address is used by an existing order and cannot be deleted");
        }
        addressRepository.delete(address);
        return "Address deleted successfully with addressId: " + addressId;
    }

    /** Loads the address only if it belongs to the logged-in user; otherwise behaves as "not found". */
    private Address findOwned(Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "addressId", addressId));
        Long currentUserId = authUtil.loggedInUserId();
        if (address.getUser() == null || !address.getUser().getUserId().equals(currentUserId)) {
            throw new ResourceNotFoundException("Address", "addressId", addressId);
        }
        return address;
    }

    private void copyFields(Address address, AddressDTO dto) {
        address.setStreet(dto.getStreet().trim());
        address.setBuildingName(dto.getBuildingName().trim());
        address.setCity(dto.getCity().trim());
        address.setState(dto.getState().trim());
        address.setCountry(dto.getCountry().trim());
        address.setPincode(dto.getPincode().trim());
    }
}
