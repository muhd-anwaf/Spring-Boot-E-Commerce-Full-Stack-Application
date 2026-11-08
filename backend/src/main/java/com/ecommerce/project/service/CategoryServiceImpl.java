package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import com.ecommerce.project.exceptions.ResourceNotFoundException;
import com.ecommerce.project.model.Category;
import com.ecommerce.project.payload.CategoryDTO;
import com.ecommerce.project.payload.CategoryResponse;
import com.ecommerce.project.repositories.CategoryRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class CategoryServiceImpl implements CategoryService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("categoryId", "categoryName");

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getAllCategories(Integer pageNumber, Integer pageSize, String sortBy, String sortOrder) {
        if (pageNumber == null || pageNumber < 0 || pageSize == null || pageSize < 1 || pageSize > 100) {
            throw new APIException("pageNumber must be 0 or greater and pageSize between 1 and 100");
        }
        if (!SORTABLE_FIELDS.contains(sortBy)) {
            throw new APIException("Cannot sort categories by '" + sortBy + "'");
        }
        Sort sort = "desc".equalsIgnoreCase(sortOrder) ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageDetails = PageRequest.of(pageNumber, pageSize, sort);
        Page<Category> categoryPage = categoryRepository.findAll(pageDetails);

        CategoryResponse response = new CategoryResponse();
        response.setContent(categoryPage.getContent().stream()
                .map(category -> modelMapper.map(category, CategoryDTO.class)).toList());
        response.setPageNumber(categoryPage.getNumber());
        response.setPageSize(categoryPage.getSize());
        response.setTotalElements(categoryPage.getTotalElements());
        response.setTotalPages(categoryPage.getTotalPages());
        response.setLastPage(categoryPage.isLast());
        return response;
    }

    @Override
    @Transactional
    public CategoryDTO createCategory(CategoryDTO categoryDTO) {
        String name = categoryDTO.getCategoryName().trim();
        if (categoryRepository.findByCategoryName(name) != null) {
            throw new APIException("Category with the name " + name + " already exists");
        }
        Category category = new Category();
        category.setCategoryName(name);
        return modelMapper.map(categoryRepository.save(category), CategoryDTO.class);
    }

    @Override
    @Transactional
    public CategoryDTO deleteCategory(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "categoryId", categoryId));
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            throw new APIException("Category still has products. Move or delete them first.");
        }
        categoryRepository.delete(category);
        return modelMapper.map(category, CategoryDTO.class);
    }

    @Override
    @Transactional
    public CategoryDTO updateCategory(CategoryDTO categoryDTO, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "categoryId", categoryId));
        String name = categoryDTO.getCategoryName().trim();
        Category sameName = categoryRepository.findByCategoryName(name);
        if (sameName != null && !sameName.getCategoryId().equals(categoryId)) {
            throw new APIException("Category with the name " + name + " already exists");
        }
        category.setCategoryName(name);
        return modelMapper.map(categoryRepository.save(category), CategoryDTO.class);
    }
}
