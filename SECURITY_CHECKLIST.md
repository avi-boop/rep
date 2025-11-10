# Mobile Repair Dashboard - Security Checklist

## 🔒 Comprehensive Security Guide

This checklist covers all security aspects of your mobile repair shop dashboard. Follow this guide to protect customer data, prevent breaches, and maintain compliance.

---

## 1. Authentication & Authorization

### Password Security
- [ ] **Passwords hashed with bcrypt** (minimum 10 rounds)
  ```javascript
  const hashedPassword = await bcrypt.hash(password, 10);
  ```
- [ ] **Minimum password requirements enforced**:
  - At least 8 characters
  - Mix of uppercase, lowercase, numbers
  - Special characters recommended
- [ ] **Password reset flow secure**:
  - Time-limited reset tokens (1 hour expiry)
  - Tokens stored hashed in database
  - One-time use tokens
- [ ] **No passwords stored in plain text** (anywhere!)
- [ ] **No passwords in logs**

### JWT (JSON Web Tokens)
- [ ] **JWT secret is strong and random** (64+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] **JWT expiry set appropriately** (8 hours recommended)
- [ ] **Refresh tokens implemented** (separate secret, longer expiry)
- [ ] **Tokens validated on every request**
- [ ] **Token payload minimal** (user ID, role only)
- [ ] **Tokens signed with HS256 or RS256**
- [ ] **Tokens not stored in localStorage** (use httpOnly cookies instead)

### Session Management
- [ ] **Session IDs are random and unpredictable**
- [ ] **Session timeout after inactivity** (30 minutes recommended)
- [ ] **Sessions invalidated on logout**
- [ ] **Concurrent session limits** (optional)
- [ ] **Session fixation prevention**

### Account Lockout
- [ ] **Failed login attempts tracked**
- [ ] **Account locked after 5 failed attempts**
- [ ] **Lockout duration: 15 minutes minimum**
- [ ] **Admin notification on repeated lockouts**
- [ ] **CAPTCHA after 3 failed attempts** (optional)

### Multi-Factor Authentication (MFA)
- [ ] **2FA available for admin accounts** (strongly recommended)
- [ ] **TOTP (Time-based One-Time Password) supported**
- [ ] **Backup codes provided**
- [ ] **SMS 2FA as alternative** (less secure but better than nothing)

### Role-Based Access Control (RBAC)
- [ ] **Roles clearly defined**:
  - Admin: Full access
  - Manager: Read/write repairs, customers, pricing
  - Technician: Read/write assigned repairs only
  - Front Desk: Create orders, read-only pricing
- [ ] **Permissions checked on every API call**
- [ ] **Least privilege principle applied**
- [ ] **No hardcoded admin credentials**

---

## 2. Data Protection

### Encryption at Rest
- [ ] **Database encrypted** (use PostgreSQL encryption or encrypted volumes)
- [ ] **Sensitive fields encrypted in database**:
  - Customer passwords (hashed with bcrypt)
  - Device passcodes (encrypted with AES-256)
  - Payment information (never store cards!)
- [ ] **Encryption keys stored securely** (AWS KMS, HashiCorp Vault)
- [ ] **Key rotation policy defined** (annual rotation)

### Encryption in Transit
- [ ] **HTTPS/TLS enforced** (no HTTP allowed)
- [ ] **TLS 1.2 or higher only**
- [ ] **Valid SSL certificate installed**
- [ ] **HSTS header enabled**
  ```nginx
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  ```
- [ ] **All third-party API calls use HTTPS**

### Personal Identifiable Information (PII)
- [ ] **PII access logged** (who accessed what customer data)
- [ ] **PII retention policy defined** (delete after X years)
- [ ] **Customer data export available** (GDPR right to data portability)
- [ ] **Customer data deletion available** (GDPR right to be forgotten)
- [ ] **PII not in logs** (mask phone numbers, emails)
- [ ] **PII not in error messages**

### Payment Card Industry (PCI DSS)
- [ ] **Never store credit card numbers**
- [ ] **Never store CVV codes**
- [ ] **Use payment gateway (Stripe/Square)** - they handle PCI compliance
- [ ] **Only store payment gateway IDs**
- [ ] **PCI SAQ (Self-Assessment Questionnaire) completed** (if applicable)

---

## 3. Input Validation & Sanitization

### SQL Injection Prevention
- [ ] **Use parameterized queries only** (Prisma ORM does this)
- [ ] **Never concatenate user input into SQL**
  ```javascript
  // ❌ NEVER DO THIS
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  
  // ✅ DO THIS
  const user = await prisma.user.findUnique({ where: { email } });
  ```
- [ ] **Input validation on all user inputs**
- [ ] **Database user has minimal permissions**

### Cross-Site Scripting (XSS) Prevention
- [ ] **All user input sanitized before display**
- [ ] **React's built-in XSS protection utilized** (JSX escapes by default)
- [ ] **dangerouslySetInnerHTML avoided** (or sanitized with DOMPurify)
- [ ] **Content Security Policy (CSP) header set**
  ```nginx
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'";
  ```
- [ ] **User-generated HTML stripped** (if accepting HTML input)

### Cross-Site Request Forgery (CSRF) Prevention
- [ ] **CSRF tokens on all forms**
- [ ] **SameSite cookie attribute set**
  ```javascript
  res.cookie('token', jwt, { 
    httpOnly: true, 
    secure: true, 
    sameSite: 'strict' 
  });
  ```
- [ ] **Referer header checked on state-changing requests**
- [ ] **Custom headers required for API requests**

### File Upload Security
- [ ] **File type validation** (whitelist: jpg, png, pdf only)
- [ ] **File size limits enforced** (10MB max)
- [ ] **Files scanned for malware** (ClamAV or VirusTotal API)
- [ ] **Files stored outside web root** (or on S3)
- [ ] **Filenames sanitized** (remove special characters, spaces)
- [ ] **No execution of uploaded files**
- [ ] **Content-Type headers validated**

### API Input Validation
- [ ] **All inputs validated with Joi or Zod**
  ```typescript
  const schema = z.object({
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    price: z.number().positive()
  });
  ```
- [ ] **Type checking enforced** (TypeScript)
- [ ] **Range checks on numbers**
- [ ] **Length limits on strings**
- [ ] **Enum validation for fixed values**

---

## 4. API Security

### Authentication
- [ ] **All API endpoints require authentication** (except login, public pages)
- [ ] **Authorization header validated**: `Bearer <token>`
- [ ] **Invalid tokens rejected with 401**
- [ ] **Expired tokens rejected**

### Rate Limiting
- [ ] **Rate limiting implemented**
  ```javascript
  // Example: 100 requests per minute per IP
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100
  });
  ```
- [ ] **Different limits for different endpoints**:
  - Login: 5 attempts per 15 minutes
  - SMS send: 10 per hour
  - General API: 100 per minute
- [ ] **Rate limit headers returned**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 95
  X-RateLimit-Reset: 1638360000
  ```
- [ ] **IP-based and user-based rate limiting**

### CORS (Cross-Origin Resource Sharing)
- [ ] **CORS restricted to known origins**
  ```javascript
  const corsOptions = {
    origin: ['https://yourrepairshop.com', 'https://app.yourrepairshop.com'],
    credentials: true
  };
  ```
- [ ] **Wildcard (*) CORS NOT used in production**
- [ ] **Preflight requests handled**

### API Versioning
- [ ] **API versioned** (e.g., `/api/v1/...`)
- [ ] **Deprecation strategy defined**
- [ ] **Breaking changes communicated**

### Error Handling
- [ ] **No sensitive data in error messages**
  ```javascript
  // ❌ DON'T
  res.status(500).json({ error: error.stack });
  
  // ✅ DO
  res.status(500).json({ error: 'Internal server error' });
  ```
- [ ] **Detailed errors logged server-side only**
- [ ] **Generic error messages to client**
- [ ] **Error codes for debugging** (without exposing internals)

---

## 5. Infrastructure Security

### Server Hardening
- [ ] **Firewall configured** (only ports 80, 443, 22 open)
- [ ] **SSH key-based authentication** (password auth disabled)
- [ ] **Root login disabled**
- [ ] **Fail2ban installed** (auto-ban brute force attempts)
- [ ] **Automatic security updates enabled**
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure --priority=low unattended-upgrades
  ```
- [ ] **Unnecessary services disabled**
- [ ] **Non-root user runs application**

### Database Security
- [ ] **Database not publicly accessible** (internal network only)
- [ ] **Strong database password**
- [ ] **Database user has minimal permissions**
- [ ] **Disable remote root login**
- [ ] **Regularly update PostgreSQL**
- [ ] **Connection limits set**

### Redis Security
- [ ] **Redis password protected**
- [ ] **Redis not publicly accessible**
- [ ] **Disable dangerous commands**:
  ```
  rename-command FLUSHDB ""
  rename-command FLUSHALL ""
  rename-command KEYS ""
  ```
- [ ] **Regular Redis updates**

### Environment Variables
- [ ] **Secrets in environment variables** (not in code)
- [ ] **.env file in .gitignore**
- [ ] **Different secrets per environment** (dev, staging, prod)
- [ ] **Secrets manager used** (AWS Secrets Manager, HashiCorp Vault, or Doppler)
- [ ] **Secrets rotated regularly** (quarterly recommended)

### Docker Security (if using)
- [ ] **Run containers as non-root**
- [ ] **Use official base images**
- [ ] **Keep images updated**
- [ ] **Scan images for vulnerabilities** (`docker scan`)
- [ ] **Limit container resources** (CPU, memory)
- [ ] **Use Docker secrets for sensitive data**

---

## 6. Monitoring & Logging

### Logging
- [ ] **All authentication attempts logged**
- [ ] **Failed logins logged**
- [ ] **Data access logged** (who viewed which customer)
- [ ] **Data changes logged** (audit trail)
- [ ] **Security events logged**:
  - Failed authorization
  - Rate limit exceeded
  - Suspicious activity
- [ ] **Logs stored securely** (not publicly accessible)
- [ ] **Logs retained** (90 days minimum)
- [ ] **Logs encrypted**
- [ ] **No sensitive data in logs** (mask PII)

### Monitoring
- [ ] **Real-time monitoring setup** (Sentry, Datadog)
- [ ] **Alerts for security events**:
  - Multiple failed logins
  - Unusual traffic patterns
  - API rate limit exceeded
  - Database errors
- [ ] **Uptime monitoring** (UptimeRobot)
- [ ] **SSL certificate expiry monitoring**
- [ ] **Resource usage monitoring** (CPU, memory, disk)

### Incident Response
- [ ] **Incident response plan documented**
- [ ] **Security contact designated**
- [ ] **Breach notification procedure defined**
- [ ] **Customer notification template prepared**
- [ ] **Regular security drills** (test incident response)

---

## 7. Third-Party Security

### Dependency Management
- [ ] **Regular dependency updates**
  ```bash
  npm audit
  npm audit fix
  npm outdated
  ```
- [ ] **Automated dependency scanning** (Dependabot, Snyk)
- [ ] **Review dependencies before adding**
- [ ] **Minimal dependencies** (only what you need)
- [ ] **Lock file committed** (package-lock.json)

### Third-Party Services
- [ ] **API keys stored securely** (environment variables)
- [ ] **API keys rotated regularly**
- [ ] **Principle of least privilege** (minimal API permissions)
- [ ] **Third-party SLAs reviewed**
- [ ] **Data sharing agreements signed**
- [ ] **Third-party security audits reviewed**

### Webhooks
- [ ] **Webhook signatures verified** (Stripe, Twilio)
  ```javascript
  const signature = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.body, signature, secret);
  ```
- [ ] **Webhook IPs whitelisted** (if possible)
- [ ] **Replay attack prevention** (timestamp validation)

---

## 8. Backup & Disaster Recovery

### Backups
- [ ] **Automated daily backups**
- [ ] **Backups stored offsite** (S3, different region)
- [ ] **Backups encrypted**
- [ ] **Backup retention: 30 days**
- [ ] **Backups tested monthly** (restore to staging)
- [ ] **Backup restoration procedure documented**

### Disaster Recovery
- [ ] **RTO (Recovery Time Objective) defined**: 4 hours
- [ ] **RPO (Recovery Point Objective) defined**: 24 hours
- [ ] **Failover plan documented**
- [ ] **Regular DR drills** (quarterly)
- [ ] **Emergency contact list updated**

---

## 9. Compliance

### GDPR (if serving EU customers)
- [ ] **Privacy policy published**
- [ ] **Cookie consent banner** (if using cookies)
- [ ] **Customer data export available**
- [ ] **Customer data deletion available**
- [ ] **Data processing agreement** (with cloud providers)
- [ ] **Data breach notification procedure** (72 hours)

### CCPA (if serving California customers)
- [ ] **Privacy notice includes CCPA rights**
- [ ] **Do Not Sell My Personal Information** link (if applicable)

### PCI DSS (if handling payments)
- [ ] **Use payment gateway** (Stripe/Square handles this)
- [ ] **Never store card data**
- [ ] **SAQ (Self-Assessment Questionnaire) completed**

### Data Retention
- [ ] **Data retention policy documented**
- [ ] **Old data purged regularly**
- [ ] **Customer consent for data retention**

---

## 10. Mobile App Security (if applicable)

### App Security
- [ ] **Certificate pinning** (prevent MITM attacks)
- [ ] **API keys not hardcoded** in app
- [ ] **Local data encrypted**
- [ ] **Biometric authentication** (fingerprint, Face ID)
- [ ] **Jailbreak/root detection**
- [ ] **Code obfuscation**

---

## 11. Physical Security

### Device Security
- [ ] **Customer devices stored securely** (locked area)
- [ ] **Access to device storage restricted**
- [ ] **Device inventory system** (track location)
- [ ] **Security cameras** (storage area)

### Workstation Security
- [ ] **Staff computers password-protected**
- [ ] **Auto-lock after inactivity** (5 minutes)
- [ ] **Antivirus installed**
- [ ] **Firewall enabled**
- [ ] **Regular security training for staff**

---

## 12. Security Testing

### Pre-Production Testing
- [ ] **Penetration testing** (before launch)
- [ ] **Vulnerability scanning** (Nessus, OpenVAS)
- [ ] **SQL injection testing**
- [ ] **XSS testing**
- [ ] **CSRF testing**
- [ ] **Authentication bypass testing**
- [ ] **Authorization testing** (access control)

### Ongoing Testing
- [ ] **Quarterly security audits**
- [ ] **Automated security scanning** (Snyk, OWASP ZAP)
- [ ] **Bug bounty program** (optional, for mature systems)

---

## 13. Staff Security Training

### Awareness Training
- [ ] **Phishing awareness training**
- [ ] **Password best practices**
- [ ] **Social engineering awareness**
- [ ] **Data handling procedures**
- [ ] **Incident reporting procedure**

### Access Management
- [ ] **Onboarding procedure** (account creation)
- [ ] **Offboarding procedure** (immediate access revocation)
- [ ] **Regular access reviews** (quarterly)
- [ ] **Principle of least privilege**

---

## 14. Documentation

### Security Documentation
- [ ] **Security policy document**
- [ ] **Incident response plan**
- [ ] **Data handling procedures**
- [ ] **Employee security agreement**
- [ ] **Third-party security requirements**
- [ ] **Disaster recovery plan**

### Change Management
- [ ] **All changes logged**
- [ ] **Security review for major changes**
- [ ] **Rollback plan for deployments**

---

## Security Assessment Score

Rate your system on each category (1-10):

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | ___/10 | |
| Data Protection | ___/10 | |
| Input Validation | ___/10 | |
| API Security | ___/10 | |
| Infrastructure | ___/10 | |
| Monitoring | ___/10 | |
| Dependencies | ___/10 | |
| Backups | ___/10 | |
| Compliance | ___/10 | |
| Testing | ___/10 | |

**Total: ___/100**

**Target Score: 80+** for production launch

---

## Security Incident Report Template

**Date**: ___________________  
**Severity**: [ ] Low | [ ] Medium | [ ] High | [ ] Critical  
**Discovered By**: ___________________  
**Description**: ___________________  
**Affected Systems**: ___________________  
**Customer Data Impacted**: [ ] Yes | [ ] No  
**Action Taken**: ___________________  
**Resolution**: ___________________  
**Lessons Learned**: ___________________  

---

## Security Contact

**Security Officer**: ___________________  
**Email**: ___________________  
**Phone**: ___________________  

**Report Security Issues**: security@yourrepairshop.com

---

## Compliance Certifications (Future)

Consider pursuing these as you grow:

- [ ] **ISO 27001** (Information Security Management)
- [ ] **SOC 2 Type II** (Service Organization Controls)
- [ ] **PCI DSS Level 1** (if processing $6M+/year in cards)

---

**Security Audit Date**: ___________________  
**Next Audit Due**: ___________________  
**Audited By**: ___________________  
**Status**: [ ] Pass | [ ] Fail | [ ] Conditional Pass

---

**Remember**: Security is an ongoing process, not a one-time checklist. Regular reviews and updates are essential!

🔒 Stay secure! 🔒
