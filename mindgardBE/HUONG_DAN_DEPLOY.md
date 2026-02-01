# Hướng dẫn Deploy MindGard API lên AWS Elastic Beanstalk (Free Tier)

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn deploy ứng dụng Spring Boot Docker lên AWS Elastic Beanstalk sử dụng free tier.

## ⚙️ Chuẩn bị

### 1. Cài đặt các công cụ cần thiết

```powershell
# AWS CLI
# Download từ: https://aws.amazon.com/cli/

# EB CLI
pip install awsebcli

# Docker Desktop
# Download từ: https://www.docker.com/products/docker-desktop
```

### 2. Cấu hình AWS CLI

```powershell
aws configure
# Nhập:
# - AWS Access Key ID
# - AWS Secret Access Key  
# - Default region: ap-southeast-1 (hoặc region bạn muốn)
# - Default output format: json
```

## 🚀 Các bước Deploy

### Bước 1: Tạo ECR Repository

1. Đăng nhập AWS Console → **ECR**
2. Click **Create repository**
3. Name: `mindgard-api`
4. Click **Create**

### Bước 2: Build và Push Docker Image

Sử dụng script tự động:

```powershell
cd mindgardBE
.\deploy.ps1
```

Hoặc làm thủ công:

```powershell
# 1. Login ECR
$accountId = (aws sts get-caller-identity --query Account --output text)
$region = "ap-southeast-1"
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $accountId.dkr.ecr.$region.amazonaws.com

# 2. Build image
docker build -t mindgard-api .

# 3. Tag và push
docker tag mindgard-api:latest $accountId.dkr.ecr.$region.amazonaws.com/mindgard-api:latest
docker push $accountId.dkr.ecr.$region.amazonaws.com/mindgard-api:latest
```

### Bước 3: Tạo RDS PostgreSQL Database

1. AWS Console → **RDS** → **Create database**
2. Chọn **PostgreSQL**
3. Template: **Free tier**
4. Settings:
   - DB instance identifier: `mindgard-db`
   - Master username: `mindgard`
   - Master password: **Tạo password mạnh** (lưu lại!)
5. Instance configuration: **db.t3.micro** (free tier)
6. Storage: **20 GB**
7. **Quan trọng**: Bật **Public access** = **Yes**
8. Database name: `mindgard`
9. Click **Create database**

**Đợi 5-10 phút** để database được tạo xong, sau đó copy **Endpoint**.

### Bước 4: Khởi tạo Elastic Beanstalk

```powershell
cd mindgardBE

# Khởi tạo EB application
eb init

# Chọn:
# - Region: ap-southeast-1
# - Application name: mindgard-api
# - Platform: Docker
# - Platform version: Latest

# Tạo environment
eb create mindgard-api-env --instance-type t3.micro
```

### Bước 5: Cấu hình Environment Variables

Sau khi RDS đã sẵn sàng, lấy endpoint và cấu hình:

```powershell
# Thay các giá trị sau:
# - YOUR_RDS_ENDPOINT: endpoint từ RDS Console
# - YOUR_DB_PASSWORD: password bạn đã tạo
# - YOUR_JWT_SECRET: secret key cho JWT (tạo random string)

eb setenv `
  SPRING_PROFILES_ACTIVE=docker `
  SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_RDS_ENDPOINT:5432/mindgard `
  SPRING_DATASOURCE_USERNAME=mindgard `
  SPRING_DATASOURCE_PASSWORD=YOUR_DB_PASSWORD `
  APP_JWT_SECRET_KEY=YOUR_JWT_SECRET
```

### Bước 6: Cấu hình Security Groups

1. **EC2 Console** → **Security Groups**
2. Tìm security group của **RDS** (`mindgard-db`)
3. **Edit inbound rules** → Thêm rule:
   - Type: PostgreSQL
   - Port: 5432
   - Source: Security group của Elastic Beanstalk (hoặc IP của EB instance)

### Bước 7: Deploy

```powershell
# Đảm bảo Dockerrun.aws.json đã có ECR URI đúng (script deploy.ps1 đã tự động cập nhật)
eb deploy
```

### Bước 8: Kiểm tra

```powershell
# Xem logs
eb logs

# Mở URL
eb open

# Test API
# Mở browser: http://YOUR_EB_URL/swagger-ui
```

## 🔄 Cập nhật Code

Khi có code mới:

```powershell
# 1. Build và push image mới
.\deploy.ps1

# 2. Deploy lại
eb deploy
```

## 🐛 Troubleshooting

### Lỗi: Cannot connect to database

**Giải pháp:**
1. Kiểm tra Security Groups đã cho phép kết nối chưa
2. Kiểm tra RDS endpoint có đúng không:
   ```powershell
   eb printenv | findstr DATASOURCE
   ```
3. Kiểm tra RDS đã sẵn sàng chưa (status = Available)

### Lỗi: Image not found

**Giải pháp:**
1. Kiểm tra image đã được push lên ECR chưa
2. Kiểm tra ECR URI trong `Dockerrun.aws.json` có đúng không
3. Chạy lại `.\deploy.ps1`

### Xem logs chi tiết

```powershell
# Logs realtime
eb logs --stream

# SSH vào instance
eb ssh
docker ps
docker logs <container_id>
```

## 💰 Chi phí Free Tier

- ✅ **EC2 t3.micro**: 750 giờ/tháng (đủ cho 1 instance 24/7)
- ✅ **RDS db.t3.micro**: 750 giờ/tháng
- ✅ **ECR**: 500MB storage/tháng
- ✅ **Data Transfer**: 15GB outbound/tháng

**Lưu ý**: Monitor usage qua AWS Cost Explorer để tránh vượt free tier.

## 📝 Checklist Deploy

- [ ] AWS CLI đã cấu hình
- [ ] EB CLI đã cài đặt
- [ ] Docker đã cài đặt
- [ ] ECR repository đã tạo
- [ ] Docker image đã push lên ECR
- [ ] RDS PostgreSQL đã tạo và sẵn sàng
- [ ] Security Groups đã cấu hình đúng
- [ ] Environment variables đã set
- [ ] Deploy thành công
- [ ] API hoạt động (test qua Swagger)

## 🔗 Tài liệu tham khảo

- [AWS Elastic Beanstalk Docker Guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker.html)
- [RDS Free Tier](https://aws.amazon.com/rds/free/)
- [EB CLI Commands](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html)

## 💡 Tips

1. **Sử dụng AWS Systems Manager Parameter Store** cho secrets thay vì hardcode
2. **Enable CloudWatch Logs** để dễ debug
3. **Setup database backups** trong RDS
4. **Monitor costs** thường xuyên qua AWS Cost Explorer
5. **Test kỹ trước khi deploy** production
