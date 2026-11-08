package com.ecommerce.project.config;


import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {
    @Bean
    public OpenAPI customOpenAPI(){
        SecurityScheme bearerScheme = new SecurityScheme().type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT Bearer Token");
        SecurityRequirement bearerRequirement = new SecurityRequirement()
                .addList("Bearer Authentication");
        return new OpenAPI().info(new Info().title("Spring Boot E-Commerce App").license(new License().name("MIT").url("https://opensource.org/licenses/MIT")).description("REST API for the E-Shop storefront. Sign in via POST /api/auth/signin, then authorize with the returned jwtToken.").contact(new Contact().name("anwaf").email("muhd.anwaf@gmail.com"))).components(new Components().addSecuritySchemes("Bearer Authentication",bearerScheme)).addSecurityItem(bearerRequirement);
    }
}
