package com.financas.app.repository;

import com.financas.app.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR c.user IS NULL ORDER BY c.name ASC")
    List<Category> findByUserIdOrGlobal(@Param("userId") UUID userId);
}

