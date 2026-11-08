package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Address;
import com.ecommerce.project.model.Cart;
import com.ecommerce.project.model.CartItem;
import com.ecommerce.project.model.Order;
import com.ecommerce.project.model.OrderItem;
import com.ecommerce.project.model.OrderStatus;
import com.ecommerce.project.model.Payment;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.payload.AddressDTO;
import com.ecommerce.project.payload.OrderDTO;
import com.ecommerce.project.payload.OrderItemDTO;
import com.ecommerce.project.payload.OrderResponse;
import com.ecommerce.project.payload.PaymentDTO;
import com.ecommerce.project.repositories.AddressRepository;
import com.ecommerce.project.repositories.CartRepository;
import com.ecommerce.project.repositories.OrderRepository;
import com.ecommerce.project.repositories.PaymentRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.util.ProductDtoMapper;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class OrderServiceImpl implements OrderService {

    public static final String MOCK_CARD = "MOCK_CARD";
    public static final String COD = "COD";

    @Autowired
    CartRepository cartRepository;

    @Autowired
    AddressRepository addressRepository;

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    PaymentRepository paymentRepository;

    @Autowired
    CartService cartService;

    @Autowired
    ModelMapper modelMapper;

    @Autowired
    ProductRepository productRepository;

    @Autowired
    ProductDtoMapper productDtoMapper;

    @Override
    @Transactional
    public OrderDTO placeOrder(String emailId, Long addressId, String paymentMethod) {
        String method = paymentMethod == null ? "" : paymentMethod.trim().toUpperCase();
        if (!MOCK_CARD.equals(method) && !COD.equals(method)) {
            throw new APIException("Unsupported payment method. Use MOCK_CARD or COD");
        }

        Cart cart = cartRepository.findCartByEmail(emailId);
        if (cart == null || cart.getCartItems().isEmpty()) {
            throw new APIException("Your cart is empty");
        }

        Address address = addressRepository.findById(addressId)
                .filter(a -> a.getUser() != null && emailId.equals(a.getUser().getEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("Address", "addressId", addressId));

        // Lock the products (in a fixed order to avoid deadlocks) and re-check stock at checkout time
        List<CartItem> cartItems = cart.getCartItems().stream()
                .sorted(Comparator.comparing(item -> item.getProduct().getProductId()))
                .toList();
        for (CartItem item : cartItems) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getProductId())
                    .orElseThrow(() -> new APIException("A product in your cart is no longer available"));
            if (product.getQuantity() < item.getQuantity()) {
                throw new APIException("Only " + product.getQuantity() + " of " + product.getProductName()
                        + " left in stock. Update your cart and try again.");
            }
        }

        // Mock/test payment: the server decides the result, nothing is charged
        Payment payment = MOCK_CARD.equals(method)
                ? new Payment(method, "mock_" + UUID.randomUUID(), "SUCCEEDED", "Test payment approved", "MockPay")
                : new Payment(method, null, "PENDING", "Pay on delivery", "COD");
        payment = paymentRepository.save(payment);

        Order order = new Order();
        order.setEmail(emailId);
        order.setOrderDate(LocalDate.now());
        order.setTotalAmount(cart.getTotalPrice());
        order.setOrderStatus(OrderStatus.PLACED);
        order.setAddress(address);
        order.setPayment(payment);

        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setDiscount(cartItem.getDiscount());
            orderItem.setOrderedProductPrice(cartItem.getProductPrice());
            orderItem.setOrder(order);
            order.getOrderItems().add(orderItem);

            Product product = cartItem.getProduct();
            product.setQuantity(product.getQuantity() - cartItem.getQuantity());
            productRepository.save(product);
        }

        Order savedOrder = orderRepository.save(order); // cascades to the order items
        payment.setOrder(savedOrder);
        cartService.clearCart(cart.getCartId());

        return toOrderDto(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrders(String emailId, Integer pageNumber, Integer pageSize) {
        Page<Order> page = orderRepository.findByEmail(emailId, pageRequest(pageNumber, pageSize));
        return toResponse(page);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDTO getOrder(Long orderId, String emailId, boolean admin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));
        if (!admin && !order.getEmail().equals(emailId)) {
            throw new ResourceNotFoundException("Order", "orderId", orderId);
        }
        return toOrderDto(order);
    }

    @Override
    @Transactional
    public OrderDTO cancelOrder(Long orderId, String emailId) {
        Order order = orderRepository.findById(orderId)
                .filter(o -> o.getEmail().equals(emailId))
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));
        if (!OrderStatus.PLACED.equals(order.getOrderStatus())) {
            throw new APIException("Only orders that are still PLACED can be cancelled");
        }
        cancelAndRestock(order);
        return toOrderDto(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getAllOrders(Integer pageNumber, Integer pageSize) {
        return toResponse(orderRepository.findAll(pageRequest(pageNumber, pageSize)));
    }

    @Override
    @Transactional
    public OrderDTO updateStatus(Long orderId, String status) {
        String newStatus = status == null ? "" : status.trim().toUpperCase();
        if (!OrderStatus.ALL.contains(newStatus)) {
            throw new APIException("Status must be one of " + String.join(", ", OrderStatus.ALL));
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "orderId", orderId));
        String current = order.getOrderStatus();
        if (OrderStatus.CANCELLED.equals(current) || OrderStatus.DELIVERED.equals(current)) {
            throw new APIException("A " + current + " order can no longer be changed");
        }
        if (OrderStatus.CANCELLED.equals(newStatus)) {
            cancelAndRestock(order);
        } else {
            order.setOrderStatus(newStatus);
            orderRepository.save(order);
        }
        return toOrderDto(order);
    }

    private void cancelAndRestock(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getProductId()).orElse(null);
            if (product != null) {
                product.setQuantity(product.getQuantity() + item.getQuantity());
                productRepository.save(product);
            }
        }
        order.setOrderStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    private PageRequest pageRequest(Integer pageNumber, Integer pageSize) {
        if (pageNumber == null || pageNumber < 0 || pageSize == null || pageSize < 1 || pageSize > 100) {
            throw new APIException("pageNumber must be 0 or greater and pageSize between 1 and 100");
        }
        return PageRequest.of(pageNumber, pageSize, Sort.by("orderId").descending());
    }

    private OrderResponse toResponse(Page<Order> page) {
        OrderResponse response = new OrderResponse();
        response.setContent(page.getContent().stream().map(this::toOrderDto).toList());
        response.setPageNumber(page.getNumber());
        response.setPageSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setLastPage(page.isLast());
        return response;
    }

    private OrderDTO toOrderDto(Order order) {
        OrderDTO dto = new OrderDTO();
        dto.setOrderId(order.getOrderId());
        dto.setEmail(order.getEmail());
        dto.setOrderDate(order.getOrderDate());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setOrderStatus(order.getOrderStatus());
        if (order.getPayment() != null) {
            dto.setPayment(modelMapper.map(order.getPayment(), PaymentDTO.class));
        }
        if (order.getAddress() != null) {
            dto.setAddressId(order.getAddress().getAddressId());
            dto.setAddress(modelMapper.map(order.getAddress(), AddressDTO.class));
        }
        dto.setOrderItems(order.getOrderItems().stream().map(item -> {
            OrderItemDTO itemDto = new OrderItemDTO();
            itemDto.setOrderItemId(item.getOrderItemId());
            itemDto.setProduct(productDtoMapper.toDto(item.getProduct()));
            itemDto.setQuantity(item.getQuantity());
            itemDto.setDiscount(item.getDiscount());
            itemDto.setOrderedProductPrice(item.getOrderedProductPrice());
            return itemDto;
        }).toList());
        return dto;
    }
}
