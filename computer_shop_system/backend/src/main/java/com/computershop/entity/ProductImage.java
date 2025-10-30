package com.computershop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_images_seq")
    @SequenceGenerator(name = "product_images_seq", sequenceName = "product_images_seq", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Map to product_images.image_url (varchar 500 in DB schema)
    @Column(name = "image_url", length = 500, nullable = false)
    private String filePath;

    @Column(name = "is_primary")
    @Builder.Default
    private Boolean isPrimary = false;
}
