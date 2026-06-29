package com.ecommerce.project.controller;

import com.ecommerce.project.model.Address;
import com.ecommerce.project.model.User;
import com.ecommerce.project.payload.AddressDTO;
import com.ecommerce.project.service.AddressService;
import com.ecommerce.project.util.AuthUtil;
import jakarta.validation.Valid;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class AddressController {

    @Autowired
    AuthUtil authUtil;

    @Autowired
    AddressService addressService;
    @Autowired
    private ModelMapper modelMapper;


    @PostMapping("/addresses")
    public ResponseEntity<AddressDTO> createAddress(@Valid  @RequestBody AddressDTO addressDTO){
        User user = authUtil.loggedInUser();
        AddressDTO savedAddressDTO = addressService.createAddress(addressDTO,user);
        return new ResponseEntity<>(savedAddressDTO, HttpStatus.CREATED);
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<AddressDTO>> getAddresses(){

        List<AddressDTO> addressList = addressService.getAddress();
        return new ResponseEntity<>(addressList, HttpStatus.FOUND);
    }

    @GetMapping("/addresses/{addressId}")
    public ResponseEntity<AddressDTO> getAddressesById(@PathVariable Long addressId){

        Address address = addressService.getAddressById(addressId);
        AddressDTO addressDTO = modelMapper.map(address, AddressDTO.class);
        return new ResponseEntity<>(addressDTO, HttpStatus.FOUND);
    }
    @GetMapping("/user/addresses")
    public ResponseEntity<List<AddressDTO>> getUserAddresses(){
        User user = authUtil.loggedInUser();
        List<AddressDTO> addressList = addressService.getUserAddress(user);

        return new ResponseEntity<>(addressList, HttpStatus.FOUND);

    }
    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<AddressDTO> UpdateAddressesById(@PathVariable Long addressId,
                                                          @RequestBody AddressDTO addressDTO){

        Address address = addressService.updateAddress(addressId, addressDTO);
        addressDTO = modelMapper.map(address, AddressDTO.class);
        return new ResponseEntity<>(addressDTO, HttpStatus.OK);
    }

    @DeleteMapping ("/addresses/{addressId}")
    public ResponseEntity<String> deleteAddressesById(@PathVariable Long addressId){

        String status = addressService.deleteAddressById(addressId);

        return new ResponseEntity<>(status, HttpStatus.OK);
    }



}
