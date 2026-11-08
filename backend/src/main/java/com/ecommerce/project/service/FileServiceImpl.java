package com.ecommerce.project.service;

import com.ecommerce.project.exceptions.APIException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@Service
public class FileServiceImpl implements FileService {

    /** Only these image types are accepted; the extension is derived from the content type, not the file name. */
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif");

    @Override
    public String uploadImage(String path, MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new APIException("Please choose an image file to upload");
        }
        String extension = ALLOWED_TYPES.get(file.getContentType());
        if (extension == null) {
            throw new APIException("Only JPEG, PNG, WebP or GIF images are allowed");
        }

        String fileName = UUID.randomUUID() + extension;
        Path folder = Paths.get(path);
        Files.createDirectories(folder);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, folder.resolve(fileName));
        }
        return fileName;
    }
}
