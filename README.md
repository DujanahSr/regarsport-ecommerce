# 🏆 RegarSport v2 — Distributed Microservices E-Commerce Platform

> **Production-grade, Event-Driven E-Commerce Architecture built with Java 21, Spring Boot 3, Spring Cloud Gateway, PostgreSQL, Redis, RabbitMQ, and React TypeScript.**

[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud Gateway](https://img.shields.io/badge/Spring%20Cloud-Gateway-blue.svg)](https://spring.io/projects/spring-cloud-gateway)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3-orange.svg)](https://www.rabbitmq.com/)
[![Automated Tests](https://img.shields.io/badge/Tests-51%20Passed-success.svg)](#testing)

---

## 📐 System Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │       Frontend: React 19 + TypeScript (Vite)          │
                    └───────────────────────────┬────────────────────────────┘
                                                │ HTTP / REST
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │        API Gateway (Spring Cloud Gateway :8080)        │
                    │   • Edge JWT Authentication & Claim Header Forwarding  │
                    │   • Global CORS & Redis Rate Limiting                  │
                    │   • Unified OpenAPI / Swagger Documentation            │
                    └───────────┬──────────────┬──────────────┬──────────────┘
                                │              │              │
             ┌──────────────────┘              │              └──────────────────┐
             ▼                                 ▼                                 ▼
   ┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐
   │     Auth Service     │          │   Catalog Service    │          │    Order Service     │
   │     (Port 8086)      │          │     (Port 8087)      │          │     (Port 8088)      │
   │ • Spring Security 6  │          │ • Redis Cache-Aside  │          │ • Shopping Cart      │
   │ • Stateless JWT      │          │ • Optimistic Locking │          │ • Checkout Engine    │
   │ • Bcrypt / RBAC      │          │ • Category & Products│          │ • RabbitMQ Producer  │
   └──────────┬───────────┘          └──────────┬───────────┘          └──────────┬───────────┘
              │                                 │                                 │
      PostgreSQL (auth)                 PostgreSQL (catalog)              PostgreSQL (order)
                                                                                  │
                                                                          AMQP Topic Exchange
                                                                          (OrderCreatedEvent)
                                                                                  │
                                             ┌────────────────────────────────────┴──────────┐
                                             ▼                                               ▼
                                  ┌──────────────────────┐                        ┌──────────────────────┐
                                  │   Payment Service    │                        │ Notification Service │
                                  │     (Port 8089)      │                        │     (Port 8089)      │
                                  │ • Midtrans Snap API  │                        │ • Async Mail Worker  │
                                  │ • Webhook Idempotency│                        │ • JavaMailSender     │
                                  │ • Status Publisher   │                        │   (Mailpit Preview)  │
                                  └──────────┬───────────┘                        └──────────────────────┘
                                             │
                                    PostgreSQL (payment)
```

---

## 🌟 Key Engineering Features

1. **Database-per-Service Architecture:**
   * 4 isolated databases (`regarsport_auth`, `regarsport_catalog`, `regarsport_order`, `regarsport_payment`). Zero cross-database SQL joins; communication is handled strictly via decoupled REST contracts and asynchronous messaging.
2. **Event-Driven Pipeline with RabbitMQ:**
   * When an order is placed, `order-service` publishes `OrderCreatedEvent` to `order.exchange`.
   * `payment-service` consumes the event to initialize Midtrans Snap payment tokens.
   * On successful payment, `payment-service` publishes `PaymentStatusUpdatedEvent` back to the broker, which automatically marks the order as `PAID`.
3. **Strict Webhook Idempotency Pattern:**
   * Prevents duplicate transaction executions from repeated payment gateway retries using composite idempotency keys (`orderNumber_transactionStatus`).
4. **Redis Cache-Aside Pattern:**
   * Lightning-fast catalog browsing with `@Cacheable` and automated cache invalidation (`@CacheEvict`) on mutations.
5. **Modern Java 21 & Virtual Threads:**
   * Full adoption of Java `record` for immutable DTOs, Pattern Matching, and **Virtual Threads (Project Loom)** via `spring.threads.virtual.enabled=true`.
6. **Robust Test Suite (JUnit 5 + Mockito):**
   * **51 automated tests** covering Service layers, WebMvc controllers, and Security filters with comprehensive mock assertions.

---

## 📁 Multi-Module Project Structure

```text
RegarStore/
├── backend/
│   ├── pom.xml                 # Master Parent POM (Spring Boot 3.3.4, Spring Cloud 2023.0.3)
│   ├── common-dto/             # Shared DTOs, Event Models & API Response Wrapper
│   ├── api-gateway/            # Spring Cloud Gateway (Port 8080)
│   ├── auth-service/           # Spring Security 6 & JWT Auth (Port 8086)
│   ├── catalog-service/        # Product & Category with Redis Caching (Port 8087)
│   ├── order-service/          # Cart, Checkout & RabbitMQ Event Producer (Port 8088)
│   └── payment-service/        # Midtrans, Idempotency & Async Mail (Port 8089)
├── docker/
│   ├── docker-compose.yml      # Local dev stack (Postgres, Redis, RabbitMQ, Mailpit)
│   └── init-db/                # Automated database creation scripts
├── FE/
│   └── regarsport-frontend/    # React 19 + TypeScript + Tailwind CSS
└── .github/
    └── workflows/ci.yml        # Automated CI/CD test runner
```

---

## ⚡ Quick Start

### 1. Start Local Infrastructure (Docker)
```bash
cd docker
docker compose up -d
```
* **PostgreSQL:** `localhost:5432`
* **Redis:** `localhost:6379`
* **RabbitMQ Dashboard:** `http://localhost:15672` (guest / guest)
* **Mailpit Web UI:** `http://localhost:8025`

### 2. Build & Test Backend
```bash
cd backend
mvn clean test
```

### 3. Run Microservices
Run each service using Maven Spring Boot plugin:
```bash
mvn -pl auth-service spring-boot:run
mvn -pl catalog-service spring-boot:run
mvn -pl order-service spring-boot:run
mvn -pl payment-service spring-boot:run
mvn -pl api-gateway spring-boot:run
```

### 4. Interactive OpenAPI / Swagger UI
Access the unified API documentation:
```
http://localhost:8080/swagger-ui.html
```

---

## 🧪 Testing Summary

```text
Module               Tests Run    Failures    Errors
------------------------------------------------------
catalog-service      15           0           0
auth-service         10           0           0
order-service        12           0           0
payment-service      8            0           0
api-gateway          6            0           0
------------------------------------------------------
Total                51           0           0  (100% Passed)
```

---

## 👨‍💻 Author

**Abu Dujanah Siregar**
* Industrial Engineering Graduate (GPA 3.75/4.00, Accelerated Program)
* Java Backend Fundamentals Instructor
* Email: abudujanahsiregar@gmail.com
