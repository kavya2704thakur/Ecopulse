package com.ecopulse.backend.repository;

import com.ecopulse.backend.entity.KeypadUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeypadUserRepository extends JpaRepository<KeypadUser, Long> {
    Optional<KeypadUser> findByPhoneNumber(String phoneNumber);
}