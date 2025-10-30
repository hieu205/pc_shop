package com.computershop.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "inventory_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"product", "performedBy"})
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "inventory_logs_seq")
    @SequenceGenerator(name = "inventory_logs_seq", sequenceName = "inventory_logs_seq", allocationSize = 1)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false, length = 10)
    private ChangeType changeType;

    @NotNull
    @Column(name = "quantity_change", nullable = false)
    private Integer quantityChange;

    @Size(max = 200)
    @Column(name = "reason", length = 200)
    private String reason;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by", nullable = false)
    private User performedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // Custom constructor for essential fields
    public InventoryLog(Product product, ChangeType changeType, Integer quantityChange, 
                       String reason, User performedBy) {
        this.product = product;
        this.changeType = changeType;
        this.quantityChange = quantityChange;
        this.reason = reason;
        this.performedBy = performedBy;
        this.createdAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        InventoryLog that = (InventoryLog) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // Enum for change type according to database schema
    public enum ChangeType {
        IN,  // Thêm hàng (restock, returns)
        OUT  // Bớt hàng (sales, damage, adjustments)
    }
    
    // Helper methods for easier usage
    public static ChangeType getChangeTypeForOperation(String operation) {
        switch (operation.toUpperCase()) {
            case "RESTOCK":
            case "RETURN":
            case "ADJUSTMENT_IN":
                return ChangeType.IN;
            case "SALE":
            case "DAMAGE":
            case "ADJUSTMENT_OUT":
            default:
                return ChangeType.OUT;
        }
    }
    
    public boolean isStockIncrease() {
        return changeType == ChangeType.IN;
    }
    
    public boolean isStockDecrease() {
        return changeType == ChangeType.OUT;
    }
}
