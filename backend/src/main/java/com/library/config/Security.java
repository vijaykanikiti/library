package com.library.config;

import com.library.security.JwtFilter;
import com.library.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class Security {

  private final JwtFilter jwtFilter;
  private final UserDetailsServiceImpl userDetailsService;

  public Security(JwtFilter jwtFilter, UserDetailsServiceImpl userDetailsService) {
    this.jwtFilter = jwtFilter;
    this.userDetailsService = userDetailsService;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
    authProvider.setUserDetailsService(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());
    return authProvider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        // Public auth endpoints
        .requestMatchers("/api/auth/**").permitAll()
        // Public book browsing for landing page
        .requestMatchers(HttpMethod.GET, "/api/books/**").permitAll()
        // WebSocket endpoint
        .requestMatchers("/ws/**").permitAll()
        // Admin specific endpoints
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        // Staff endpoints (Admin or Librarian)
        .requestMatchers("/api/reports/**").hasAnyRole("ADMIN", "LIBRARIAN")
        .requestMatchers(HttpMethod.POST, "/api/books/**").hasAnyRole("ADMIN", "LIBRARIAN")
        .requestMatchers(HttpMethod.PUT, "/api/books/**").hasAnyRole("ADMIN", "LIBRARIAN")
        .requestMatchers(HttpMethod.DELETE, "/api/books/**").hasAnyRole("ADMIN", "LIBRARIAN")
        .requestMatchers(HttpMethod.POST, "/api/loans/issue").hasAnyRole("ADMIN", "LIBRARIAN")
        .requestMatchers(HttpMethod.POST, "/api/loans/*/return").hasAnyRole("ADMIN", "LIBRARIAN")
        .requestMatchers(HttpMethod.POST, "/api/fines/*/record-payment").hasAnyRole("ADMIN", "LIBRARIAN")
        // All other endpoints require authentication
        .anyRequest().authenticated()
      )
      .authenticationProvider(authenticationProvider())
      .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}
