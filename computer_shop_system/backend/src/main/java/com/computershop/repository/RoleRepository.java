package com.computershop.repository;

import com.computershop.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    /**
     * Tìm role theo tên
     */
    Optional<Role> findByName(String name);
    
    /**
     * Kiểm tra role có tồn tại theo tên
     */
    boolean existsByName(String name);
}
