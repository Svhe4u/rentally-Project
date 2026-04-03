# IMPLEMENTATION CHECKLIST - Rentally Production Refactoring

## Phase 1: Setup & Migration (Week 1)
**Estimated Time: 2-3 days**

### Backend Setup
- [ ] Backup original files: `cp -r api api_backup_old`
- [ ] Replace settings.py with settings_new.py
  ```bash
  cp rentally_backend/settings_new.py rentally_backend/settings.py
  ```
- [ ] Copy .env.template to .env
  ```bash
  cp .env.template .env
  ```
- [ ] Update .env with actual values:
  - [ ] SECRET_KEY (generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"`)
  - [ ] DATABASE_URL (from Neon PostgreSQL)
  - [ ] CLOUDINARY credentials
  - [ ] EMAIL credentials
- [ ] Install updated dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- [ ] Make migrations:
  ```bash
  python manage.py makemigrations
  ```
- [ ] Review migrations (open migrations/0001_initial.py)
  - [ ] Check all models are included
  - [ ] Verify relationships
- [ ] Run migrations:
  ```bash
  python manage.py migrate
  ```
- [ ] Create superuser:
  ```bash
  python manage.py createsuperuser
  ```
- [ ] Verify admin works:
  ```bash
  python manage.py runserver
  # Visit http://localhost:8000/admin
  ```

### Database Population
- [ ] Create initial categories:
  ```python
  # Django shell: python manage.py shell
  from api.models import Category
  categories = ['Apartment', 'House', 'Office', 'Shop', 'Land']
  for name in categories:
      Category.objects.create(name=name, slug=name.lower())
  ```
- [ ] Create initial regions (Mongolian):
  ```python
  from api.models import Region
  regions = [
      'Улаанбаатар', 'Дархан', 'Эрдэнэт', 'Архангай'
      # ... add all regions
  ]
  ```
- [ ] Create test listings and users for testing

### Backend Testing
- [ ] Test API with Postman/curl
  - [ ] List listings: `GET /api/listings/`
  - [ ] Create listing: `POST /api/listings/`
  - [ ] Token endpoint: `POST /api/auth/token/`
- [ ] Verify error responses have correct format
- [ ] Test pagination
- [ ] Test filtering

---

## Phase 2: Frontend Refactoring (Week 1-2)
**Estimated Time: 3-4 days**

### Dependencies
- [ ] Update package.json with new packages:
  ```json
  {
    "dependencies": {
      "expo-secure-store": "^13.0.0",
      "react-native-async-storage": "^1.21.0"
    }
  }
  ```
- [ ] Install dependencies:
  ```bash
  npm install
  ```

### API Service
- [ ] Update environment variables:
  ```bash
  # In .env.local or constants
  REACT_APP_API_URL=https://your-backend-url/api
  ```
- [ ] Replace api.ts with refactored version
- [ ] Test API calls:
  - [ ] List listings
  - [ ] Get listing detail
  - [ ] Login/token endpoints

### Context & State Management
- [ ] Create `context/` folder
- [ ] Add AuthContext.tsx (provided)
  - [ ] Test login flow
  - [ ] Test token persistence
  - [ ] Test logout
- [ ] Create AppContext.tsx for global state (if needed)
- [ ] Add to App.tsx:
  ```typescript
  <AuthProvider>
    <ErrorBoundary>
      {/* Your app content */}
    </ErrorBoundary>
  </AuthProvider>
  ```

### Error Handling
- [ ] Add ErrorBoundary.tsx to components
- [ ] Add LoadingSpinner.tsx to components
- [ ] Wrap screens with error boundaries
- [ ] Add try-catch blocks to async functions
- [ ] Test error scenarios

### Validation & Formatting
- [ ] Add utils/validators.ts
- [ ] Add utils/formatters.ts
- [ ] Add constants/index.ts
- [ ] Replace magic strings with constants:
  - [ ] Screen names
  - [ ] Status values
  - [ ] Categories
- [ ] Add form validation to login/register screens

### Component Updates
- [ ] Update HomeScreen to use context for auth
- [ ] Update LoginScreen with validators
- [ ] Update each screen to handle loading/error states
- [ ] Add error callbacks to all API calls
- [ ] Add retry logic for failed requests

---

## Phase 3: UI/UX Improvements (Week 2-3)
**Estimated Time: 2-3 days**

### Loading States
- [ ] Show spinner on initial load
- [ ] Show spinner while loading listings
- [ ] Show spinner while processing bookings
- [ ] Add skeleton/placeholder loading

### Error Messages
- [ ] Display API errors in user-friendly format
- [ ] Add "Retry" button for failed requests
- [ ] Add offline detection and messaging
- [ ] Log errors to console for debugging

### User Feedback
- [ ] Add success toast messages
  - [ ] Listing created
  - [ ] Booking confirmed
  - [ ] Review posted
- [ ] Add confirmation dialogs for critical actions
- [ ] Add loading indicators for buttons

### Responsive Design
- [ ] Test on different screen sizes
- [ ] Adjust layouts for landscape
- [ ] Ensure touch targets are 44x44 minimum
- [ ] Test with different font sizes

---

## Phase 4: Testing (Week 3)
**Estimated Time: 2-3 days**

### Backend Testing
- [ ] Setup pytest:
  ```bash
  pip install pytest pytest-django
  ```
- [ ] Create `tests/` directory
- [ ] Write tests for services:
  - [ ] `test_listing_service.py`
  - [ ] `test_booking_service.py`
  - [ ] `test_review_service.py`
- [ ] Write tests for views:
  - [ ] `test_listing_views.py`
  - [ ] `test_booking_views.py`
- [ ] Run tests:
  ```bash
  pytest -v
  ```
- [ ] Achieve >80% code coverage

### Frontend Testing
- [ ] Setup Jest/React Native testing:
  ```bash
  npm install --save-dev @testing-library/react-native jest
  ```
- [ ] Write tests for components
- [ ] Write tests for hooks
- [ ] Write tests for API client
- [ ] Run tests:
  ```bash
  npm test
  ```

### Integration Testing
- [ ] Test full login flow
- [ ] Test listing creation → booking flow
- [ ] Test message sending
- [ ] Test offline functionality

### Manual Testing
- [ ] Create test accounts (user, broker)
- [ ] Test all critical user flows:
  - [ ] Register → Login → View Listings
  - [ ] Create Listing → Add Images
  - [ ] Make Booking → Add Review
  - [ ] Send Message
  - [ ] Search/Filter Listings
- [ ] Test on real device (Android/iOS)
- [ ] Test network failures (disconnect WiFi)

---

## Phase 5: Deployment (Week 4)
**Estimated Time: 1-2 days**

### Backend Deployment (Render.com)

#### Prepare
- [ ] Create production database (Neon PostgreSQL)
- [ ] Create production Cloudinary account
- [ ] Generate strong SECRET_KEY for production
- [ ] Create Render.com account

#### Deploy
- [ ] Create web service on Render
- [ ] Connect GitHub repo
- [ ] Set environment variables:
  - [ ] SECRET_KEY
  - [ ] DATABASE_URL (production)
  - [ ] DEBUG=False
  - [ ] ALLOWED_HOSTS
  - [ ] All API keys
- [ ] Set build command:
  ```bash
  python manage.py migrate && python manage.py collectstatic --noinput
  ```
- [ ] Deploy and verify
  - [ ] Check admin interface works
  - [ ] Check API endpoints respond
  - [ ] Check database connections

#### Post-Deploy
- [ ] Run migrations on production database
- [ ] Create production user accounts
- [ ] Setup monitoring (Sentry)
- [ ] Setup logging
- [ ] Setup daily backups

### Frontend Deployment (Vercel/Render)

#### Prepare
- [ ] Set production API URL:
  ```bash
  REACT_APP_API_URL=https://rentally-api-production.com/api
  ```
- [ ] Build optimized bundle:
  ```bash
  npm run build
  ```
- [ ] Test production build locally

#### Deploy
- [ ] Deploy to Vercel or Render
- [ ] Setup domain/SSL
- [ ] Configure CORS on backend for new URL
- [ ] Test all flows in production

#### Mobile App
- [ ] Build for Android/iOS
- [ ] Test on real devices
- [ ] Submit to app stores (Google Play, Apple App Store)

---

## Phase 6: Monitoring & Optimization (Ongoing)
**Estimated Time: Continuous**

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Setup performance monitoring
- [ ] Setup database monitoring
- [ ] Setup API rate limiting
- [ ] Create alerts for critical errors

### Optimization
- [ ] Monitor database query performance
- [ ] Optimize slow queries
- [ ] Setup caching (Redis)
- [ ] Compress images
- [ ] Minimize bundle size

### Security
- [ ] Run security audit:
  ```bash
  pip install safety
  safety check
  ```
- [ ] Update dependencies regularly
- [ ] Review CORS configuration
- [ ] Test for SQL injection
- [ ] Test for XSS vulnerabilities
- [ ] Rotate secrets regularly

### Analytics
- [ ] Setup Google Analytics
- [ ] Track user flows
- [ ] Monitor popular listings
- [ ] Track conversion rates

---

## Troubleshooting Guide

### Common Issues

#### Database Migration Errors
```python
# If migration fails, try:
python manage.py migrate --fake-initial
python manage.py migrate api --plan
```

#### Token not working
- Check SECRET_KEY in settings
- Verify token expiration
- Check Authorization header format
- Clear browser cache/SecureStore

#### CORS Errors
- Update CORS_ALLOWED_ORIGINS in settings
- Check frontend API URL
- Verify backend is running

#### Image Upload Issues
- Check Cloudinary credentials
- Verify file size < 5MB
- Check supported formats

#### Performance Issues
- Check database indexes
- Use Django Debug Toolbar
- Check N+1 queries with select_related
- Monitor server resources

---

## Success Criteria

Your refactoring is complete when:

- [x] All models created and migrated
- [x] All serializers working for validation
- [x] All services encapsulating business logic
- [x] All views clean and using services
- [x] All API endpoints tested and working
- [x] Frontend context and hooks implemented
- [x] Error handling on frontend and backend
- [x] Form validation working
- [x] Unit and integration tests passing (>80% coverage)
- [x] Deployed to production
- [x] Monitoring and logging configured
- [x] Performance meets targets (<200ms API response)
- [x] Security checks passed
- [x] Team can explain architecture

---

## Final Notes

1. **Keep old code**: Don't delete old files until everything works in production
2. **Document changes**: Keep changelog of modifications
3. **Test thoroughly**: Manual testing is as important as automated
4. **Monitor production**: Watch error logs and performance metrics
5. **Get feedback**: Ask team/users for feedback on changes
6. **Iterate**: Refactoring is never truly "done" - keep improving

---

## Contact & Support

For questions or issues:
- Check REFACTORING_GUIDE.md for detailed explanations
- Review Django/DRF documentation
- Check React Native/Expo documentation
- Review docstrings in code

---

**Status**: Ready for Implementation
**Expected Duration**: 3-4 weeks
**Team Size**: 1-2 developers
