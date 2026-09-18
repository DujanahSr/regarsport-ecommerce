package com.regarsport.catalog.mapper;

import com.regarsport.catalog.dto.ProductRequest;
import com.regarsport.catalog.dto.ProductResponse;
import com.regarsport.catalog.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        if (product == null) return null;
        Long categoryId = product.getCategory() != null ? product.getCategory().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;
        return new ProductResponse(
                product.getId(),
                categoryId,
                categoryName,
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getImageUrl(),
                product.getSizeStocks(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }

    public Product toEntity(ProductRequest request) {
        if (request == null) return null;
        Product product = Product.builder()
                .name(request.name().trim())
                .description(request.description())
                .price(request.price())
                .stock(request.stock())
                .imageUrl(request.imageUrl())
                .build();

        if (request.sizeStocks() != null && !request.sizeStocks().isEmpty()) {
            product.setSizeStocks(new java.util.LinkedHashMap<>(request.sizeStocks()));
            product.recalculateTotalStock();
        } else {
            product.initDefaultSizeStocks();
        }
        return product;
    }

    public void updateEntityFromRequest(ProductRequest request, Product product) {
        if (request == null || product == null) return;
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setImageUrl(request.imageUrl());

        if (request.sizeStocks() != null && !request.sizeStocks().isEmpty()) {
            product.setSizeStocks(new java.util.LinkedHashMap<>(request.sizeStocks()));
            product.recalculateTotalStock();
        } else {
            product.setStock(request.stock());
            product.initDefaultSizeStocks();
        }
    }
}
