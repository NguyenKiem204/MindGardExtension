# MindGardAPI

## Requirements
- Java 17
- Maven wrapper (`mvnw.cmd` on Windows)
- Docker + Docker Compose (để chạy DB)

## Swagger / OpenAPI
- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Build (local)
```powershell
.\mvnw.cmd -DskipTests package
```

## Run (Cách B: dev local + DB trong Docker)
### 1) Chạy DB bằng Docker
```bash
docker compose up -d db
```

### 2) Chạy API local với hot reload (DevTools)
```powershell
$env:SPRING_PROFILES_ACTIVE="local"
.\mvnw.cmd spring-boot:run
```

### 3) Xem log realtime
- Log API (local): xem trực tiếp trong terminal đang chạy `spring-boot:run`
- Log DB (docker):
```bash
docker compose logs -f db
```

## Run (Cách A: full Docker)
```bash
docker compose up -d --build
```

## Reset DB
```bash
docker compose down -v
```
