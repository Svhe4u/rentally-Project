# RENTALLY - ОНОЛ, АРГА ЗҮЙ БОЛОН СУДАЛГАА

## НЭГ. СЭДВИЙН СУДЛАГДСАН БАЙДАЛ / СУДАЛГААНЫ ОНОЛ АРГА ЗҮЙ

### 1.1 Ерөнхий судалгаа

Монголын үл хөдлөх хөрөнгөний түрээсийн үйлчилгээ салбар сүүлийн жилүүдэд хүчтэй хөгжиж байгаа бөгөөд, цахим платформуудын төлөөлөг шийдлүүдэд дэлхийн ихэнх орнуудад өргөнөөр ашиглагдаж байна. 

**Дэлхийн түрээсийн технологийн хөгжил:**
- Airbnb (АНУ), Booking.com (Нидерланд), Zillow (АНУ) зэрэг олон улсын платформууд 2008 оноос хойш үл хөдлөх хөрөнгөний түрээсийг онлайнаар хангуулж байгаа.
- Мобайл программуудын ашигласу 78%-д хүрээ (2023).
- API-аар нэгтгэгдсэн төлбөрийн системүүд салбарыг 40% хөгжүүлэв.

**Монгол дахь нөхцөл байдал:**
- Баялаг түрээслэгчдийн хоорондын үнэлгээ системийн дутагдал байна.
- Байлалч болон түрээслэгчдийн холбоо холбох сувалгаа хүндэлэнгүй байна.
- Төлбөрийн аюулгүй байдлын нэгтгэлт шийдлүүд хүнтэй байна.
- Баялагын мэдээлэл нэгэн платформд цуглуулагдаагүй байна.

**Rentally системийн зорилго:**
1. Баялаг болон түрээслэгчдийн хооронд найдвартай үнэлгээ системийг үүсгэх
2. Монголын байл хайлтын сонголтын шаардлагыг хамруулах
3. Төлбөрийн аюулгүй байдлыг нэгтгэх
4. Мобайл-прист ашигласыг дэмжих

---

### 1.2 Одоогийн системийн судалгаа

#### 1.2.1 Сонгосон байгууллагын судалгаа

**Rentally системийн үүсэл ба үйл ажиллагаа:**

Rentally платформ 2023 онд Монголын үл хөдлөх хөрөнгөний түрээсийн салбарын дижиталжуулалтын зорилгоор хөгжүүлэгдэж эхэлсэн.

**Системийн цар хүрээ ба хүрээ:**
- **Хэрэглэгчдийн төрөл:** 
  - Ердийн хэрэглэгч (buyer/renter)
  - Байлалч (broker/landlord)
  - Админ (administrator)

- **Үйл ажиллагааны салбарууд:**
  - Баялагын жагсаалт ба удирдлага
  - Баялагын сонголт ба сүүлийн үзүүлэлт
  - Түрээсийн захиалга (booking)
  - Үнэлгээ ба рецензи (review system)
  - Байлалч болон түрээслэгчдийн холбоо (messaging)
  - Төлбөрийн процесс
  - Дуртай баялагуудын хадгалалт (favorites)

- **Ашигласын хүрээ:**
  - Нийслэл Улаанбаатар ба түүний дүүргүүд (Баянзүрх, Сүхбаатар, Хан-Уул, Баянгол, Сонгинохайрхан, Чингэлтэй, Налайх, Багануур)
  - Өрөө түрээслүүлэх, байшингийн, оффис түрээслэх үйл ажиллагаа

**Системийн архитектурын хүрээ:**

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React Native + Expo / TypeScript)        │
│  - HomeScreen - жагсаалтын үзүүлэлт                │
│  - ListingDetailScreen - баялагын дэлгэрүүлэлт     │
│  - BookingScreen - түрээсийн захиалга              │
│  - ProfileScreen - хэрэглэгчийн профайл            │
│  - MessageScreen - мессежийн холболт               │
└────────────────────┬────────────────────────────────┘
                     │
         REST API Gateway (HTTP/HTTPS)
                     │
        ┌────────────▼────────────────────────┐
        │  Django REST API Backend            │
        │  ─────────────────────────         │
        │  - api/views.py - үзүүлэлт        │
        │  - api/services.py - бизнесийн логик│
        │  - api/serializers.py - өгөгдлийн урвалцал│
        │  - api/models.py - өгөгдлийн объект│
        │  - api/auth_views.py - нэвтрэх ба бүртгэлт│
        │  - api/urls.py - URL-ын маршрут   │
        └────────────┬──────────────────────┘
                     │
        ┌────────────▼──────────────────────┐
        │  PostgreSQL Database              │
        │  ──────────────────              │
        │  - User (Django auth)            │
        │  - UserProfile (цөлөг мэдээлэл)  │
        │  - BrokerProfile (байлалчийн)    │
        │  - Listing (баялага)             │
        │  - ListingImage (зургууд)        │
        │  - ListingDetail (дэлгэрүүлэлт)  │
        │  - ListingFeature (шинж чанарууд) │
        │  - Booking (захиалга)            │
        │  - Review (үнэлгээ)              │
        │  - Message (мессеж)              │
        │  - Payment (төлбөр)              │
        │  - Favorite (дуртай)             │
        └──────────────────────────────────┘
```

**Байгууллагын бүтцийн схем:**
- **Backend (Django):** HTTP API сервер, бизнесийн логик, өгөгдлийн процесс
- **Frontend (React Native/Expo):** Мобайл ба web-н хэрэглээч интерфэйс
- **Database (PostgreSQL):** Бүхэл өгөгдлийн сангийн удирдлага
- **Authentication:** JWT токены систем (djangorestframework-simplejwt)

#### 1.2.2 Асуудлын тодорхойлолт

**Одоогийн системийн үндсэн асуудлууд:**

1. **Үнэлгээ ба үнэн сайн байдлын асуудал:**
   - Байлалч болон түрээслэгчдийн хоорондын үнэлгээ системийн дутагдал
   - Баялагын үнэлгээний үнэн сайн байдлын хяналт сул
   - Шалгалтын журнал хутагдаагүй байна

2. **Баялагын мэдээллийн дутагдал:**
   - Баялагын сонголтын сонголтын нарийвчилалта дутуу байна
   - Монгол хэлний тодорхойлолт ба нэр томъёо тохирохгүй байна

3. **Мессежийн системийн асуудал:**
   - Шуурхан мессежийн ажиллагаа (WebSocket) байхгүй
   - Мессежийн уухуулалт (notification) системийн дутагдал

4. **Төлбөрийн системийн сорилтууд:**
   - Монголын төлбөрийн гэйтвэй-ын нэгтгэлт (XacBank, Khan Bank) хэрэгтэй
   - Төлбөрийн баталгаажуулалт (verification) системийн слабня

5. **Өгөгдлийн сотгол (Query) үр ашгийн асуудал:**
   - N+1 problem түүний үр дүнд удаа авдаг асуулга байгаа
   - Индексийн оновчлол буруу байна

---

## НЭГ. ХИЙГДЭХ СИСТЕМИЙН СУДАЛГАА

### 1.3.1 Сценарий (Бодит үйл явдлыг зохиол байдлаар дүрслэлэх)

**Сценарий 1: Байлалч баялагыг нэмэх**

1. Байаллч "user" эсвэл "broker" ролийг сонгон Rentally системд бүртгүүлнэ
2. `POST /api/auth/register/` руу нэрээ, имэйл, нууц үг, утас, ролийг илгээнэ
3. Система байлалчийн BrokerProfile объект үүсгэнэ (статус: "pending")
4. Админ байлалчийг баталгаажуулахад (статус: "approved") алдартай болно
5. Баялалч `POST /api/listings/` руу баялагын мэдээлэл оруулнэ:
   - title, description, address, latitude, longitude
   - category_id, region_id, price, price_type
6. `POST /api/listing-images/` болон `/api/upload/listing-image/` ашиглан зургууд ачаалдаг
7. `POST /api/listings/{id}/detail/` ашиглан дэлгэрүүлэн мэдээлэл (bedrooms, bathrooms, utilities) оруулдаг
8. `POST /api/listings/{id}/features/` ашиглан баялагын шинж чанарууд (feature) нэмдэг
9. Баялага `status='active'` болж байлалчийн жагсаалтад гарч ирдэг

**Сценарий 2: Түрээслэгч баялаг хайх ба үзэх**

1. Түрээслэгч `/api/listings/` рүү GET асуулга илгээнэ (параметр: region_id, category_id, price гэх мэт)
2. Систем сотгож таараасан баялагуудыг JSON массивээр буцаадаг
3. Түрээслэгч интересний баялагын ID-г сонгоно
4. `GET /api/listings/{id}/full/` руу асуулга явуулан дэлгэрүүлэлтийн мэдээлэл (ListingDetail, ListingFeature, Review) авна
5. Баялагын үнэлгээ, рецензиуудыг үзнэ
6. `/api/favorites/` рүү POST ашиглан дуртай жагсаалтад нэмнэ

**Сценарий 3: Түрээсийн захиалга (Booking) үйлчилгээ**

1. Түрээслэгч `POST /api/bookings/` руу дараахь мэдээлэл илгээнэ:
   - listing_id, start_date, end_date
2. Система үнийг автоматаар тооцоолно: `total_price = (end_date - start_date) * listing.price`
3. Захиалга `status='pending'` болон үүсгэгдэнэ
4. Байлалч `/api/bookings/{id}/` рүү PUT ашиглан захиалгыг батлах эсвэл үгүйсгэх
5. Захиалгыг батласны дараа `POST /api/payments/` руу төлбөрийн мэдээлэл илгээнэ
6. Төлбөр амжилттай болгүй "completed" статустай болдог
7. Түрээслэгч мэдээлэл илгээх эсвэл өмнө нь захиалсан баялагыг үзүүлэлт хийх боломжтой

**Сценарий 4: Мессежийн холбоо**

1. Түрээслэгч эсвэл байлалч `/api/messages/` рүү POST ашиглан мессеж илгээнэ:
   - recipient_id, listing_id, content
2. Мессеж өгөгдөлийн сангийн Message объект буюу хадгалагдаж өгөгдлийн сангид хадгалагдана
3. `/api/messages/{user_id}/` рүү GET ашиглан өмнөх мессежийн түүх авна
4. `is_read=True` болон мессеж унших үед цаг мэдээлэлтэй байдаг

**Сценарий 5: Үнэлгээ ба рецензи (Review)**

1. Түрээслэлэгч захиалгыг дуусгасны дараа `/api/reviews/` рүү POST ашиглан үнэлгээ бичнэ:
   - listing_id, rating (1-5), comment
2. Систем ёс сүүдэлт унших сайтаар үнэлгээ хадгалдаг
3. Өөр хэрэглэгчид `/api/listings/{id}/` рүү GET асуулгаар үнэлгээ болон дундаж рейтингийг үзэх боломжтой

---

### 1.3.2 Use Case (Ашигласын аргууд)

**Rentally системийн үндсэн ашигласын аргууд:**

```
┌─────────────────────────────────────────────────────────┐
│         RENTALLY LISTING MANAGEMENT USE CASE            │
└─────────────────────────────────────────────────────────┘

Actor 1: Ердийн хэрэглэгч (Renter)
├── UC1: Системд бүртгүүлэх
├── UC2: Баялагыг сонголтоор хайх
├── UC3: Баялагын дэлгэрүүлэлтийг үзэх
├── UC4: Дуртай баялагуудыг хадгалах (Favorites)
├── UC5: Баялагыг түрээслүүлэхийн захиалга үүсгэх (Booking)
├── UC6: Төлбөр гүйцэтгэх (Payment)
├── UC7: Баялагыг үнэлэх ба сэтгэгдлийг бичих (Review)
└── UC8: Байлалчтай мессеж илгээх (Messaging)

Actor 2: Байлалч (Landlord/Broker)
├── UC9: Байлалчийн профайлыг үүсгэх (BrokerProfile)
├── UC10: Баялагыг нэмэх, засварлах, устгах (Listing Management)
├── UC11: Баялагын зургуудыг ачаалах (Image Upload)
├── UC12: Баялагын дэлгэрүүлэлтийг нэмэх (ListingDetail)
├── UC13: Баялагын шинж чанарууд нэмэх (ListingFeature)
├── UC14: Захиалгыг батлах эсвэл үгүйсгэх (Booking Management)
├── UC15: Төлбөрийг хүлээн авах (Payment Acceptance)
├── UC16: Дүрсүүлэхийн тайланг үзэх (Listing Analytics)
└── UC17: Хэрэглэгчдийн үнэлгээний санал авах (Review Feedback)

Actor 3: Админ (Administrator)
├── UC18: Хэрэглэгчдийн эрхийг удирдах (User Management)
├── UC19: Баялагуудыг модерац хийх (Listing Moderation)
├── UC20: Байлалчдыг баталгаажуулах (Broker Verification)
├── UC21: Системийн үзүүлэлт ба логийг үзэх (System Monitoring)
└── UC22: Сарын тайлан гаргах (Report Generation)
```

---

### 1.3.3 Хэрэглэгчийн функциональ шаардлага

**Ердийн хэрэглэгчийн (Renter/Buyer) функциональ шаардлага:**

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| FR1.1 | Системд имэйл, нууц үг ашиглан бүртгүүлэх |
| FR1.2 | JWT токен ашиглан нэвтрэх ба гаралт |
| FR1.3 | Баялагыг бүс нутаг (region), төрөл (category), үнэ (price) дээр үндэслэнэ сонголтоор хайх |
| FR1.4 | Баялагын жагсаалтыг босго (pagination) болгон 10 орон цөлөб үзэх |
| FR1.5 | Баялагын дэлгэрүүлэлтийн мэдээлэл ба зургуудыг үзэх |
| FR1.6 | Дуртай баялагуудыг хадгалах ба харах |
| FR1.7 | Баялагыг түрээслүүлэхийн захиалгыг үүсгэх (start_date, end_date) |
| FR1.8 | Төлбөрийн мэдээлэл оруулан захиалгыг дуусгах |
| FR1.9 | Өөрийн захиалгын түүх ба статусыг үзэх |
| FR1.10 | Баялагыг үнэлэх (1-5 од) ба сэтгэгдлийг бичих |
| FR1.11 | Байлалчтай мессеж илгээх ба авах |
| FR1.12 | Өөрийн профайлын мэдээлэл (нэр, утас, хаяг) засварлах |

**Байлалчийн (Landlord/Broker) функциональ шаардлага:**

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| FR2.1 | "broker" ролийг сонгон бүртгүүлэх |
| FR2.2 | Компанийн мэдээлэл (company_name, registration_number, description) оруулах |
| FR2.3 | Лицензийн баримт (license_document) ачаалах |
| FR2.4 | Баялагыг нэмэх (title, description, address, price, price_type) |
| FR2.5 | Баялагын зургуудыг ачаалах ба үндсэн зургаас сонгох |
| FR2.6 | Баялагын дэлгэрүүлэлт (bedrooms, bathrooms, area, utilities_estimated) оруулах |
| FR2.7 | Баялагын шинж чанарууд (feature) нэмэх (жишээ: WiFi, parking) |
| FR2.8 | Баялагын үнэ, төрөл, статусыг засварлах |
| FR2.9 | Баялагыг өгөгдлийн сангаас устгах (soft delete via status='archived') |
| FR2.10 | Захиалгыг харж батлах эсвэл үгүйсгэх |
| FR2.11 | Өөрийн баялагын үнэлгээ, сэтгэгдлүүдийг үзэх |
| FR2.12 | Дүрсүүлэхийн статистик (views_count) үзэх |
| FR2.13 | Хэрэглэгчдийн мессежүүдэд хариулт өгөх |

**Админ-ийн функциональ шаардлага:**

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| FR3.1 | IsAdminUser эрхтэй хэрэглэгчдийг удирдах |
| FR3.2 | Байлалчдыг баталгаажуулах (BrokerProfile.status = 'approved') |
| FR3.3 | Баялагуудыг модерац хийх (буруу агуулгатай баялагыг устгах) |
| FR3.4 | Төлбөрийн гүйлгээний түүхийг харж аудит хийх |
| FR3.5 | Хэрэглэгчдийн роль сулруулах эсвэл баталгаа авалцуулах |
| FR3.6 | Системийн үйл ажиллагааны логүүдийг үзэх |

---

### 1.3.4 Хэрэглэгчийн функциональ бус шаардлага

#### 1.3.4.1 Хэрэглээ (Usability)

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| NFR1.1 | Системийн интерфэйс 100% Монгол хэлээр байх |
| NFR1.2 | Мобайл төхөөрөмжөө (iOS, Android) сайнаар ажиллах |
| NFR1.3 | Хэрэглэгчийн үйлдэл бүр 3 холбоо доошоо байх |
| NFR1.4 | Хайлт болон сонголтын үйлчилгээ 2 сек доошоо сүүлийхэй байх |
| NFR1.5 | Өргөх, жижиглэн санах ойн хэмжээ 50MB доошоо байх |

#### 1.3.4.2 Найдвартай байдал (Reliability)

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| NFR2.1 | Системийн үйл ажиллагааны сонирхолтой байдал (uptime) 99.5% буюу 43 мин/сарын доошоо уриагдлагдахгүй |
| NFR2.2 | Өгөгдлийн ашигласын алдаа автоматаар нүүлгүүлэх (transaction rollback) |
| NFR2.3 | Баялагын мэдээлэл 24 цаг сүүлийн үед арилгагдахгүй |
| NFR2.4 | Төлбөрийн гүйлгээ нэгэнт хэзээ үнэ цэнэгдүүлэхгүй |

#### 1.3.4.3 Хурд ба ажиллагаа (Performance)

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| NFR3.1 | Баялагын жагсаалтыг 2 сек доошоо сүүлийхэй буцаах |
| NFR3.2 | Баялагын дэлгэрүүлэлтийн хуудсыг 1.5 сек доошоо ачаалах |
| NFR3.3 | Мобайл app-ын startup хугацаа 3 сек доошоо байх |
| NFR3.4 | Нэгэн үеэр 1000 хэрэглэгч дэмжих чадвартай |
| NFR3.5 | Мессежийн хоцрол 500ms доошоо байх |

#### 1.3.4.4 Аюулгүй байдал (Security)

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| NFR4.1 | Хэрэглэгчийн нууц үг bcrypt эсвэл PBKDF2-аар шифрлэгдэх |
| NFR4.2 | Төлбөрийн информаци PCI-DSS даатгалаар хамгаалагдах |
| NFR4.3 | API-ийн бүх үйл ажиллагаа HTTPS дээр явагддаг |
| NFR4.4 | JWT токены validity 15 мин, refresh token 7 өдөр байх |
| NFR4.5 | Өгөгдлийн сангийн query-ийн SQL injection-г сээргүй байх (ORM ашиглах) |
| NFR4.6 | API-ийн асуулга rate limiting -ээр хамгаалагдах (200 req/мин per user) |

#### 1.3.4.5 Нэмэлт боломж (Additional Features)

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| NFR5.1 | WebSocket ашиглан шуурхан мессежийн notification |
| NFR5.2 | Google Maps интеграци дээр баялагын газрын байршилыг үзүүлэх |
| NFR5.3 | Push notification (Firebase Cloud Messaging) |
| NFR5.4 | Email notification төлбөр, захиалга, үнэлгээгийн тухай |
| NFR5.5 | SMS notification (XacBank, Khan Bank төлбөрийн баталгаа) |

#### 1.3.4.6 Дизайн ба Технологи (Design & Technology)

| Шаардлага | Тодорхойлолт |
|---------|-----------|
| NFR6.1 | Frontend: React Native + Expo + TypeScript |
| NFR6.2 | Backend: Django + Django REST Framework |
| NFR6.3 | Database: PostgreSQL 12+ |
| NFR6.4 | API: REST architecture, JSON format |
| NFR6.5 | Authentication: JWT (djangorestframework-simplejwt) |
| NFR6.6 | Image Storage: Cloudinary эсвэл AWS S3 |
| NFR6.7 | Deployment: Docker container |

---

## НЭГ. АРХИТЕКТУРЫН СОНГОЛТ

### 1.4.1 Программ хангамжийн архитектур

**Rentally системийн програмын хангамжийн архитектурын дизайн:**

```
┌────────────────────────────────────────────────────────────────┐
│              RENTALLY SOFTWARE ARCHITECTURE                    │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│        FRONTEND LAYER (React Native / Expo)                 │
│  ──────────────────────────────────────────────────────     │
│  App.tsx (Root Component)                                  │
│  ├── Navigation (File-based routing)                       │
│  │   ├── app/index.tsx (HomeScreen)                       │
│  │   ├── app/listings/[id].tsx (ListingDetailScreen)      │
│  │   ├── app/booking.tsx (BookingScreen)                 │
│  │   ├── app/messages.tsx (MessageScreen)                │
│  │   └── app/profile.tsx (ProfileScreen)                 │
│  ├── Context (State Management)                           │
│  │   └── AuthContext, ListingContext                      │
│  ├── Components (Reusable UI)                             │
│  │   ├── ListingCard, Header, BottomNav                   │
│  └── Constants (API endpoints, colors)                    │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  REST API Gateway   │
          │  HTTP/HTTPS POST    │
          │  GET, PUT, DELETE   │
          │  JWT Authorization  │
          └──────────┬──────────┘
                     │
┌────────────────────▼──────────────────────────────────────┐
│        BACKEND LAYER (Django REST Framework)              │
│  ────────────────────────────────────────────────────────│
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Views (api/views.py)                        │   │
│  │  - ListingListAPIView                            │   │
│  │  - BookingDetailAPIView                          │   │
│  │  - ReviewListAPIView                             │   │
│  │  - MessageListAPIView                            │   │
│  │  - UserProfileAPIView                            │   │
│  │  - BrokerProfileAPIView                          │   │
│  │  - PaymentAPIView                                │   │
│  └──────────────────────────────────────────────────┘   │
│                     ↓                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Service Layer (api/services.py)                 │   │
│  │  - ListingService                                │   │
│  │  - BookingService                                │   │
│  │  - ReviewService                                 │   │
│  │  - MessageService                                │   │
│  │  - PaymentService                                │   │
│  │  - SearchService                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                     ↓                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Serializers (api/serializers.py)                │   │
│  │  - ListingSerializer                             │   │
│  │  - BookingSerializer                             │   │
│  │  - UserProfileSerializer                         │   │
│  └──────────────────────────────────────────────────┘   │
│                     ↓                                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Models (api/models.py)                          │   │
│  │  - Listing, ListingImage, ListingDetail          │   │
│  │  - Booking, Review, Payment                      │   │
│  │  - UserProfile, BrokerProfile                    │   │
│  │  - Message, Favorite, Category, Region          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────┬──────────────────────────────────────┘
                     │
┌────────────────────▼──────────────────────────────────────┐
│        DATA LAYER (PostgreSQL Database)                   │
│  ────────────────────────────────────────────────────────│
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  User-related Tables                             │   │
│  │  - django_user (auth user)                       │   │
│  │  - api_userprofile                               │   │
│  │  - api_brokerprofile                             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Listing-related Tables                          │   │
│  │  - api_category                                  │   │
│  │  - api_region                                    │   │
│  │  - api_listing                                   │   │
│  │  - api_listingimage                              │   │
│  │  - api_listingdetail                             │   │
│  │  - api_listingfeature                            │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Transaction-related Tables                      │   │
│  │  - api_booking                                   │   │
│  │  - api_payment                                   │   │
│  │  - api_review                                    │   │
│  │  - api_message                                   │   │
│  │  - api_favorite                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Ашигласан технологийн сонголт ба түүний шалтгаан:**

| Компонент | Технологи | Шалтгаан |
|-----------|-----------|---------|
| Frontend | React Native + Expo | iOS, Android хоёрт нэгэн кодоор ажиллах, хөгжүүлэлтийн хурд |
| Programming Lang (Frontend) | TypeScript | Төрлийн аюулгүй байдал, IDE дэмжэлт |
| Backend | Django + DRF | Python-ийн баялаг ecosystem, REST API бүтэц, ORM |
| Programming Lang (Backend) | Python 3.10+ | Хэрэглэхийн хүнтэй байдал, баялаг библиотек |
| Database | PostgreSQL 12+ | Хүчтэй сонголт, JSONB тип дэмжэлт, индекс |
| Authentication | JWT (django-rest-framework-simplejwt) | Stateless, мобайл-прист, масштабасуулалт |
| Image Storage | Cloudinary API | CDN дэмжэлт, зургийн оновчлол |
| API Format | REST + JSON | Ердийн стандарт, мобайл төхөөрөмжид сайн |
| Deployment | Docker | Хөгжүүлэлт-үйлчилгээ ялгалгүй, аюулгүй |

---

### 1.4.2 Техник хангамжийн архитектур

**Хөгжүүлэлтийн орчны хамгийн бага шаардлага:**

| Хүчин зүйл | Хамгийн бага | Энгийн | Үрэнхийлэл |
|-----------|-------------|--------|-----------|
| CPU | Dual-core 2.0GHz | Quad-core 2.5GHz | Intel i5/AMD Ryzen 5+ (6+ cores) |
| RAM | 4GB | 8GB | 16GB |
| SSD | 20GB | 50GB | 100GB+ |
| OS | Windows/Mac/Linux | Windows 10+/Mac/Ubuntu | Ubuntu 20.04 LTS |
| Python | 3.8+ | 3.9+ | 3.10+ |
| Node.js | 14.x | 16.x | 18.x+ |
| PostgreSQL | 12 | 13 | 14+ |
| Docker | 20.10+ | 20.10+ | 23.0+ |

**Үйлчилгээний орчны архитектур (Production):**

```
┌──────────────────────────────────────────────────────┐
│        CLIENT LAYER                                   │
│  (App Store, Play Store, Web Browser)               │
└──────────────────────┬───────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  CDN (Cloudinary/CloudFront)│
        │  - Зургууд                  │
        │  - Static assets            │
        └──────────────┬──────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│  LOAD BALANCER (AWS ALB / Nginx)                   │
│  - HTTPS/TLS termination                          │
│  - Request routing                                 │
└──────────────────────┬───────────────────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
┌───▼────┐      ┌──────▼──┐      ┌───────▼─┐
│ App 1  │      │ App 2   │      │ App N   │
│(Django)│      │(Django) │      │(Django) │
└───┬────┘      └──────┬──┘      └───────┬─┘
    │                  │                  │
    └──────────────────┼──────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │ PostgreSQL Master (Primary)│
         │ - Write operations         │
         │ - Master DB               │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────┐
         │ PostgreSQL Replica (Standby)│
         │ - Read operations          │
         │ - Automatic failover       │
         └────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  INFRASTRUCTURE (AWS/Heroku/DigitalOcean)          │
│  - Auto-scaling (EC2 / Dyno)                       │
│  - VPC (Virtual Private Cloud)                     │
│  - Security groups (Firewall)                      │
│  - Backup & disaster recovery                      │
└──────────────────────────────────────────────────────┘
```

**Deployment стратеги:**

```
┌────────────────────────────────────────────────────┐
│  Frontend Deployment (React Native/Expo)           │
│  ────────────────────────────────────────────────  │
│  • iOS: TestFlight → App Store                    │
│  • Android: Firebase App Distribution → Play Store│
│  • Web: Vercel / Netlify (expo-web)               │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  Backend Deployment (Django)                       │
│  ────────────────────────────────────────────────  │
│  1. Docker image үүсгэх                           │
│  2. Registry-д түлхэх (Docker Hub / ECR)          │
│  3. Container orchestration (ECS / Kubernetes)    │
│  4. Rolling deployment (zero downtime)            │
│  5. Environment variables ба secrets управление   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  Database Deployment (PostgreSQL)                  │
│  ────────────────────────────────────────────────  │
│  • AWS RDS (Managed PostgreSQL)                   │
│  • Multi-AZ deployment (High availability)         │
│  • Automated backups (24-ийн backup retention)    │
│  • Point-in-time recovery (PITR)                  │
└────────────────────────────────────────────────────┘
```

---

## 1.5 Программчлалын нэмэлт судалгаа

Rentally системийг хөгжүүлэхийн тулд дараахь нэмэлт технологийн судалгаа хийж байна:

### 1.5.1 JWT Authentication ба Token Management

**Асуудал:** Мобайл app болон API хоорондын aүулгүй байдал асуудал

**Шийдэл:** `djangorestframework-simplejwt` ашиглан JWT токены систем хэмжээгээр хэрэгжүүлэх

**Технологийн дэлгэрүүлэлт:**
- Access token (15 мин validity)
- Refresh token (7 өдрийн validity)
- Rotating refresh strategy (refresh бүр шинэ refresh token үүсгэх)
- Token blacklist (logout үед)

### 1.5.2 Database Query Optimization

**Асуудал:** N+1 problem - баялагын жагсаалтыг авах үед хэрэглэгч бүрээр query явагдах

**Шийдэл:** Django ORM-ын `select_related()` ба `prefetch_related()` ашиглах

**Код жишээ:**
```python
# Сайн биш: N+1 problem
listings = Listing.objects.filter(status='active')
for listing in listings:
    print(listing.owner.username)  # Бүр query явагдаж байх

# Сайн: Optimized
listings = Listing.objects.filter(status='active').select_related('owner', 'category', 'region')
```

### 1.5.3 Database Indexing Strategy

**Асуудал:** Өнгөрөх үрсүүлэлтүүд (filter, search) удаа явах

**Шийдэл:** PostgreSQL дээр оновчтой индекс үүсгэх

**Индекс дизайн:**
```python
# models.py дээр indexes
class Meta:
    indexes = [
        models.Index(fields=['status', '-created_at']),
        models.Index(fields=['owner', 'status']),
        models.Index(fields=['category', 'region']),
    ]
```

### 1.5.4 Image Optimization ба CDN

**Асуудал:** Баялагын зургууд хүнд болж app-ыг удаа авалцуулдаг

**Шийдэл:** Cloudinary ашиглан автоматаар зургийн размер өөрчилэх

**Техник:**
- Хамаарлын хэмжээ өөрчилэлт (resize)
- Format оновчлол (WEBP)
- CDN дээр агуулах (caching)

### 1.5.5 Asynchronous Task Processing

**Асуудал:** Email илгээх, зургийн обработкаа HTTP request-ыг удаа авалцуулдаг

**Шийдэл:** Celery + Redis ашиглан background task queue

**Жишээ:**
```python
@app.task
def send_booking_email(booking_id):
    booking = Booking.objects.get(id=booking_id)
    # Email илгээх логик
    send_email(booking.user.email, ...)
```

### 1.5.6 Real-time Messaging (WebSocket)

**Асуудал:** Мессежийн систем real-time байх хэрэгтэй

**Шийдэл:** Django Channels + WebSocket

**Архитектур:**
- ASGI server (Daphne)
- Channel layer (Redis)
- Consumer class (async WebSocket handler)

### 1.5.7 Pagination Optimization

**Асуудал:** Их хэмжээний баялагын жагсаалтыг нэгэд авч ирэхэд app хүндлэнэ

**Шийдэл:** Cursor-based эсвэл offset-based pagination

```python
# Offset-based (10 орон бүрээр)
?page=1&page_size=10

# Cursor-based (илүү үр дүнтэй)
?cursor=abc123&page_size=10
```

### 1.5.8 API Rate Limiting

**Асуудал:** Систем DDoS болон spam орсоор өртөж болдог

**Шийдэл:** Django REST Framework-ын `throttling` ашиглах

```python
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

### 1.5.9 Input Validation ба Sanitization

**Асуудал:** Хэрэглэгч оруулсан өгөгдөл XSS, SQL injection сорилт үүсгэж болдог

**Шийдэл:** Django serializers, DRF validators ашиглах

```python
class ListingSerializer(serializers.ModelSerializer):
    title = serializers.CharField(max_length=255, min_length=5)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0'))
```

### 1.5.10 Testing Strategy

**Асуудал:** Систем найдвартай байх нь чухал

**Шийдэл:** Unit, Integration, E2E test

**Test төрлүүд:**
- Unit tests: Функц ба хэлбэр шалгах
- Integration tests: API endpoint-үүдийг шалгах
- E2E tests: Буртгэлээс төлбөр хүртэл

---

## ДҮГНЭЛТ

Rentally систем нь Монголын үл хөдлөх хөрөнгөний түрээсийн салбарыг дижиталжуулахад чиглэгдсэн. Системийн хөгжүүлэлтийн үндсэнд REST API, JWT authentication, PostgreSQL өгөгдлийн сан, React Native frontend, Django backend гэх технологийн сонголт байна.

Энэхүү судалгааны баримталгаас дээр үндэслэнэ системийн дизайн, өгөгдлийн загвар, API дизайн, хэрэглээч интерфэйсийн дизайн гэх үе шатуудын үйл ажиллагаа явагдана.

**Дараахь үе шатууд:**
1. Detailed system design (1-2 долоо хоног)
2. Database schema ба migration (1 долоо хоног)
3. Backend API хөгжүүлэлт (3-4 долоо хоног)
4. Frontend mobile app хөгжүүлэлт (3-4 долоо хоног)
5. Testing ба QA (2 долоо хоног)
6. Deployment ба production release (1-2 долоо хоног)
