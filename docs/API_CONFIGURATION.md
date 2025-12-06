# API Configuration Guide

This guide explains how to configure API credentials, understand the differences between free and premium tiers, and manage API rate limits.

## Table of Contents

- [Overview](#overview)
- [Free Tier vs Premium Tier](#free-tier-vs-premium-tier)
- [API Data Sources](#api-data-sources)
- [Configuring API Credentials](#configuring-api-credentials)
- [Rate Limits](#rate-limits)
- [Troubleshooting](#troubleshooting)

## Overview

The F1 Analysis Platform uses multiple public F1 APIs to provide comprehensive data access. The application works out-of-the-box with free tier access, but you can configure premium API credentials for enhanced features.

### Default Configuration

By default, the application uses:
- **Free public APIs**: No configuration required
- **Automatic rate limiting**: Respects API limits
- **Intelligent caching**: Minimizes API requests
- **Multi-source fallback**: Uses alternative APIs when needed

## Free Tier vs Premium Tier

### Free Tier (Default)

**What's Included:**
- Access to all public F1 APIs
- Historical data from 2018-present (telemetry) and 1950-present (results)
- 8 concurrent telemetry channels
- Standard update frequency (10 Hz for live data)
- All core analysis features
- Unlimited local caching

**Limitations:**
- API rate limits apply (see [Rate Limits](#rate-limits))
- Standard telemetry channels only
- 8 concurrent channels maximum
- 10 Hz update frequency for live sessions

**Best For:**
- Personal use and learning
- Historical data analysis
- Most engineering analysis tasks
- Casual F1 enthusiasts

### Premium Tier

**What's Included:**
- Everything in Free Tier, plus:
- Higher API rate limits
- 12 concurrent telemetry channels
- Additional telemetry channels (DRS, energy recovery)
- Higher update frequency (2-second intervals for live data)
- Priority API access
- Extended data retention

**Requirements:**
- Premium API credentials from supported providers
- Configuration in application settings

**Best For:**
- Professional engineering teams
- Real-time race analysis
- High-frequency data requirements
- Commercial applications

### Feature Comparison Table

| Feature | Free Tier | Premium Tier |
|---------|-----------|--------------|
| Historical Telemetry | ✅ 2018-present | ✅ 2018-present |
| Race Results | ✅ 1950-present | ✅ 1950-present |
| Live Session Data | ✅ Standard | ✅ Enhanced |
| Concurrent Channels | 8 | 12 |
| Update Frequency | 10 Hz | 50 Hz (2s intervals) |
| Standard Telemetry | ✅ | ✅ |
| DRS Data | ❌ | ✅ |
| Energy Recovery | ❌ | ✅ |
| Tire Temperature | ❌ | ✅ |
| API Rate Limits | Standard | Higher |
| Cache Retention | 30 days | 90 days |
| Export Resolution | 1080p | 4K |
| Priority Support | ❌ | ✅ |

## API Data Sources

The platform integrates with three primary data sources:

### 1. Ergast API

**Type**: Free public REST API

**Data Provided:**
- Race results and standings (1950-present)
- Lap times and sector times
- Driver and constructor information
- Circuit details
- Qualifying results

**Rate Limits:**
- 4 requests per second
- 200 requests per hour

**Configuration:**
- No API key required
- Works out-of-the-box

**Documentation**: [ergast.com/mrd](http://ergast.com/mrd/)

### 2. FastF1 / OpenF1 API

**Type**: Free public REST API

**Data Provided:**
- Telemetry data (2018-present for FastF1, 2023-present for OpenF1)
- Car position and speed
- Weather conditions
- Track status
- Radio messages (OpenF1)

**Rate Limits:**
- Respectful usage recommended
- No hard limits published

**Configuration:**
- No API key required for basic access
- Optional premium credentials for enhanced features

**Documentation**: 
- FastF1: [docs.fastf1.dev](https://docs.fastf1.dev/)
- OpenF1: [openf1.org](https://openf1.org/)

### 3. Premium APIs (Optional)

**Type**: Paid commercial APIs

**Data Provided:**
- Higher frequency telemetry
- Additional sensor data
- Real-time streaming
- Extended historical data

**Rate Limits:**
- Varies by provider and plan
- Typically much higher than free tier

**Configuration:**
- Requires API credentials
- Must be configured in settings

## Configuring API Credentials

### Accessing Settings

1. Open the F1 Analysis Platform
2. Click on **Settings** in the navigation menu
3. Navigate to **API Configuration** section

### Adding Premium Credentials

#### Step 1: Obtain API Credentials

Contact your premium API provider to obtain:
- API Key
- API Secret (if required)
- Endpoint URL (if custom)

#### Step 2: Enter Credentials

1. In Settings → API Configuration
2. Select your API provider from dropdown
3. Enter your credentials:
   - **API Key**: Your unique key
   - **API Secret**: Secret key (if applicable)
   - **Endpoint**: Custom endpoint (if applicable)
4. Click **Validate Credentials**

#### Step 3: Validate

The application will:
- Test the connection to the API
- Verify credentials are valid
- Check available features
- Display confirmation message

#### Step 4: Save

1. Click **Save Configuration**
2. Credentials are stored securely in browser storage
3. Application automatically uses premium features

### Credential Storage

**Security:**
- Credentials stored in browser's secure storage (IndexedDB)
- Never transmitted except to API endpoints
- Encrypted at rest
- Not included in exports or logs

**Persistence:**
- Credentials persist across browser sessions
- Cleared when you clear browser data
- Can be manually removed in settings

### Managing Multiple Credentials

If you have credentials for multiple providers:

1. Add each provider separately
2. Application uses best available source for each request
3. Fallback to free APIs if premium fails
4. View active provider in data source indicators

## Rate Limits

Understanding and managing API rate limits ensures smooth operation.

### Ergast API Limits

**Limits:**
- 4 requests per second
- 200 requests per hour

**How We Handle It:**
- Automatic request queuing
- Requests spread over time
- Cache-first strategy reduces requests
- Rate limit warnings in UI

**What You'll See:**
- Requests may queue during heavy usage
- "Rate limit approaching" warnings
- Automatic retry after cooldown

### FastF1 / OpenF1 limits

**Limits:**
- No hard limits published
- Respectful usage expected

**How We Handle It:**
- Reasonable request spacing
- Aggressive caching
- Batch requests when possible
- Avoid redundant calls

### Premium API Limits

**Limits:**
- Varies by provider and plan
- Typically 100-1000 requests per minute

**How We Handle It:**
- Configured based on your plan
- Automatic throttling
- Priority queuing
- Real-time limit monitoring

### Monitoring Your Usage

View API usage in Settings → API Configuration:

- **Requests Today**: Total API calls made
- **Rate Limit Status**: Current limit headroom
- **Cache Hit Rate**: Percentage served from cache
- **Provider Breakdown**: Requests per API source

### Optimizing API Usage

**Tips to Reduce API Calls:**

1. **Use Cache Effectively**
   - Let cache serve recent data
   - Don't clear cache unnecessarily
   - Increase cache retention period

2. **Batch Operations**
   - Load multiple laps at once
   - Use session-level queries
   - Export in batches

3. **Strategic Timing**
   - Avoid peak hours if possible
   - Spread analysis over time
   - Use offline mode for cached data

4. **Smart Filtering**
   - Filter before loading data
   - Use specific queries
   - Avoid loading unnecessary sessions

## Troubleshooting

### Issue: "Invalid API Credentials"

**Causes:**
- Incorrect API key or secret
- Expired credentials
- Wrong provider selected

**Solutions:**
1. Double-check credentials for typos
2. Verify credentials with provider
3. Ensure correct provider selected
4. Try re-entering credentials
5. Contact provider if issue persists

### Issue: "Rate Limit Exceeded"

**Causes:**
- Too many requests in short time
- Multiple browser tabs open
- Aggressive data loading

**Solutions:**
1. Wait for rate limit to reset (shown in UI)
2. Close duplicate browser tabs
3. Reduce concurrent operations
4. Enable more aggressive caching
5. Consider premium tier for higher limits

### Issue: "API Connection Failed"

**Causes:**
- Network connectivity issues
- API service downtime
- Firewall blocking requests
- CORS issues

**Solutions:**
1. Check internet connection
2. Verify API status (check provider status page)
3. Try different network
4. Check browser console for errors
5. Disable VPN/proxy temporarily

### Issue: "Premium Features Not Available"

**Causes:**
- Credentials not configured
- Invalid credentials
- Plan doesn't include feature
- Provider API issues

**Solutions:**
1. Verify credentials are entered and validated
2. Check your plan includes desired features
3. Re-validate credentials
4. Contact provider support
5. Check provider status page

### Issue: "Data Source Unavailable"

**Causes:**
- API temporarily down
- Rate limit reached
- Network issues

**Solutions:**
1. Application automatically falls back to alternative sources
2. Check data source indicators
3. Wait and retry
4. Clear cache and reload
5. Check API status pages

### Getting Help

If you encounter API configuration issues:

1. **Check Browser Console**: Look for error messages (F12 → Console)
2. **Verify Credentials**: Re-enter and validate
3. **Test Connection**: Use validation button
4. **Check API Status**: Visit provider status pages
5. **Review Documentation**: Check provider's API docs
6. **Contact Support**: Reach out to API provider
7. **Open Issue**: Report persistent issues on GitHub

## API Provider Resources

### Ergast API
- **Website**: [ergast.com](http://ergast.com/)
- **Documentation**: [ergast.com/mrd](http://ergast.com/mrd/)
- **Status**: No status page (community maintained)

### FastF1
- **Website**: [docs.fastf1.dev](https://docs.fastf1.dev/)
- **Documentation**: [docs.fastf1.dev](https://docs.fastf1.dev/)
- **GitHub**: [github.com/theOehrly/Fast-F1](https://github.com/theOehrly/Fast-F1)

### OpenF1
- **Website**: [openf1.org](https://openf1.org/)
- **Documentation**: [openf1.org/docs](https://openf1.org/docs)
- **Status**: Check website for updates

### Premium Providers

Contact providers directly for:
- Pricing information
- Feature availability
- Technical support
- API documentation
- Status updates

## Best Practices

### For Free Tier Users

1. **Respect Rate Limits**: Don't try to circumvent limits
2. **Use Cache**: Let cache serve data when possible
3. **Be Patient**: Queue requests during heavy usage
4. **Report Issues**: Help improve the platform

### For Premium Tier Users

1. **Secure Credentials**: Never share API keys
2. **Monitor Usage**: Track against your plan limits
3. **Rotate Keys**: Periodically update credentials
4. **Report Issues**: Contact provider for API problems

### For All Users

1. **Keep Updated**: Update application regularly
2. **Clear Cache**: Occasionally clear old data
3. **Check Status**: Monitor API health
4. **Provide Feedback**: Help improve the platform

---

## Quick Reference

### Configuration Checklist

- [ ] Obtain API credentials from provider
- [ ] Open Settings → API Configuration
- [ ] Select provider from dropdown
- [ ] Enter API key and secret
- [ ] Click "Validate Credentials"
- [ ] Verify validation succeeds
- [ ] Click "Save Configuration"
- [ ] Check premium features are enabled
- [ ] Test with sample data
- [ ] Monitor usage in settings

### Rate Limit Quick Facts

| API | Requests/Second | Requests/Hour | Requests/Day |
|-----|-----------------|---------------|--------------|
| Ergast | 4 | 200 | ~4,800 |
| FastF1 | Unlimited* | Unlimited* | Unlimited* |
| OpenF1 | Unlimited* | Unlimited* | Unlimited* |
| Premium | Varies | Varies | Varies |

*Respectful usage expected

---

**Need more help?** Check the [Getting Started Guide](./GETTING_STARTED.md) or [Feature Documentation](./FEATURES.md).
