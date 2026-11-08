package com.ecommerce.project.config;

import com.ecommerce.project.model.AppRole;
import com.ecommerce.project.model.Category;
import com.ecommerce.project.model.Product;
import com.ecommerce.project.model.Role;
import com.ecommerce.project.model.User;
import com.ecommerce.project.repositories.CategoryRepository;
import com.ecommerce.project.repositories.ProductRepository;
import com.ecommerce.project.repositories.RoleRepository;
import com.ecommerce.project.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Always makes sure the three roles exist (signup needs them).
 * When {@code app.seed.enabled=true} it also creates demo users, categories and products.
 * Demo data is meant for development only.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Value("${app.seed.password:ChangeMe123!}")
    private String seedPassword;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository,
                           CategoryRepository categoryRepository, ProductRepository productRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Role userRole = ensureRole(AppRole.ROLE_USER);
        Role sellerRole = ensureRole(AppRole.ROLE_SELLER);
        Role adminRole = ensureRole(AppRole.ROLE_ADMIN);

        if (!seedEnabled) {
            return;
        }

        ensureUser("user1", "user1@example.com", Set.of(userRole));
        User seller = ensureUser("seller1", "seller1@example.com", Set.of(sellerRole));
        ensureUser("admin", "admin@example.com", Set.of(userRole, sellerRole, adminRole));

        if (categoryRepository.count() == 0) {
            seedCatalog(seller);
        }
        logger.info("Demo data ready. Demo users: user1, seller1, admin");
    }

    private Role ensureRole(AppRole appRole) {
        return roleRepository.findByRoleName(appRole)
                .orElseGet(() -> roleRepository.save(new Role(appRole)));
    }

    private User ensureUser(String username, String email, Set<Role> roles) {
        return userRepository.findByUserName(username).orElseGet(() -> {
            User user = new User(username, email, passwordEncoder.encode(seedPassword));
            user.setRoles(new HashSet<>(roles));
            return userRepository.save(user);
        });
    }

    private void seedCatalog(User seller) {
        Category electronics = categoryRepository.save(newCategory("Electronics"));
        Category clothing = categoryRepository.save(newCategory("Clothing"));
        Category books = categoryRepository.save(newCategory("Books"));
        Category home = categoryRepository.save(newCategory("Home & Kitchen"));
        Category sports = categoryRepository.save(newCategory("Sports & Outdoors"));

        newProduct(electronics, seller, "Wireless Headphones", "Over-ear Bluetooth headphones with 30 hour battery life.", 120.00, 15, 25);
        newProduct(electronics, seller, "Smart Watch", "Fitness tracker with heart-rate monitor and GPS.", 199.99, 10, 12);
        newProduct(electronics, seller, "USB-C Charger 65W", "Fast charger for laptops, tablets and phones.", 39.50, 0, 60);
        newProduct(clothing, seller, "Cotton T-Shirt", "Soft everyday t-shirt in a regular fit.", 18.00, 0, 100);
        newProduct(clothing, seller, "Denim Jacket", "Classic denim jacket with a warm inner lining.", 75.00, 20, 18);
        newProduct(books, seller, "Clean Code", "A handbook of agile software craftsmanship.", 42.00, 10, 30);
        newProduct(books, seller, "Designing Data-Intensive Applications", "The big ideas behind reliable, scalable systems.", 55.00, 5, 0);
        newProduct(home, seller, "Non-stick Frying Pan", "28 cm pan with a durable non-stick coating.", 29.99, 0, 40);
        newProduct(home, seller, "Electric Kettle", "1.7 litre stainless steel kettle with auto shut-off.", 34.00, 10, 22);
        newProduct(sports, seller, "Yoga Mat", "6 mm thick non-slip exercise mat.", 25.00, 0, 50);
        newProduct(sports, seller, "Running Shoes", "Lightweight shoes with breathable mesh upper.", 89.00, 30, 15);
        newProduct(sports, seller, "Water Bottle 1L", "Insulated bottle that keeps drinks cold for 24 hours.", 19.00, 0, 80);
    }

    private Category newCategory(String name) {
        Category category = new Category();
        category.setCategoryName(name);
        return category;
    }

    private void newProduct(Category category, User seller, String name, String description,
                            double price, double discount, int quantity) {
        Product product = new Product();
        product.setProductName(name);
        product.setDescription(description);
        product.setPrice(price);
        product.setDiscount(discount);
        product.setSpecialPrice(Math.round((price - price * discount / 100) * 100) / 100.0);
        product.setQuantity(quantity);
        product.setImage("default.png");
        product.setCategory(category);
        product.setUser(seller);
        productRepository.save(product);
    }
}
