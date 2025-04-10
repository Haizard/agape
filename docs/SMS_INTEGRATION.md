# SMS Integration Guide

This document provides information about the SMS integration in the St. John Vianney School Management System.

## Overview

The system supports multiple SMS providers to send SMS messages to parents. This includes:

- Sending result reports to parents
- Sending notifications about school events
- Sending alerts about student attendance

## Supported SMS Providers

The system supports the following SMS providers:

1. **Africa's Talking** - Popular in East Africa with good coverage in Tanzania
2. **Twilio** - Global provider with good coverage in Tanzania
3. **Bongolive** - Tanzania-specific SMS provider with competitive local rates

You can easily switch between these providers by changing the `SMS_PROVIDER` environment variable.

## Configuration

To configure the SMS integration, you need to set the following environment variables:

```bash
# SMS Configuration
SMS_ENABLED=true
SMS_PROVIDER=africasTalking  # Options: africasTalking, twilio, bongolive
SMS_SENDER_ID=SCHOOL
SCHOOL_NAME=St. John Vianney Secondary School

# Africa's Talking SMS Configuration (if using africasTalking)
AT_API_KEY=your-api-key
AT_USERNAME=your-username
AT_API_URL=https://api.africastalking.com/version1/messaging

# Twilio SMS Configuration (if using twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Bongolive SMS Configuration (if using bongolive)
BONGOLIVE_USERNAME=your-username
BONGOLIVE_PASSWORD=your-password
BONGOLIVE_API_URL=https://api.bongolive.co.tz/v1/sendSMS
```

### Common Environment Variables

- `SMS_ENABLED`: Set to `true` to enable actual SMS sending, or `false` to use mock responses (useful for development)
- `SMS_PROVIDER`: The SMS provider to use (options: `africasTalking`, `twilio`, `bongolive`)
- `SMS_SENDER_ID`: The sender ID that will appear on SMS messages
- `SCHOOL_NAME`: The name of the school that will appear in SMS messages

### Provider-Specific Environment Variables

#### Africa's Talking

- `AT_API_KEY`: Your Africa's Talking API key
- `AT_USERNAME`: Your Africa's Talking username (use 'sandbox' for testing)
- `AT_API_URL`: The Africa's Talking API URL

#### Twilio

- `TWILIO_ACCOUNT_SID`: Your Twilio account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number

#### Bongolive

- `BONGOLIVE_USERNAME`: Your Bongolive username
- `BONGOLIVE_PASSWORD`: Your Bongolive password
- `BONGOLIVE_API_URL`: The Bongolive API URL

## Getting Started with SMS Providers

### Africa's Talking Setup

1. Sign up for an account at [Africa's Talking](https://africastalking.com/)
2. Create an application and get your API key
3. Use the sandbox environment for testing
4. When ready for production, purchase credits and switch to the live environment

### Twilio Setup

1. Sign up for an account at [Twilio](https://www.twilio.com/)
2. Get your account SID and auth token from the dashboard
3. Purchase a phone number that supports SMS
4. Use the test credentials for development

### Bongolive Setup

1. Sign up for an account at [Bongolive](https://www.bongolive.co.tz/)
2. Get your API credentials from the dashboard
3. Use the test environment for development

## Testing the SMS Integration

You can test the SMS integration using the provided test script:

```bash
node scripts/testSmsService.js
```

This script will:

1. Send a simple test message to a specified phone number
2. Generate a result report SMS for a student and send it to a specified phone number
3. Send the result report SMS to the student's parent contacts (if any)

## SMS Templates

### Result Report SMS

The result report SMS includes:

- School name
- Exam name
- Student name
- Class
- Average marks
- Division
- Points
- Rank (if available)
- Top 5 subjects with marks and grades

Example:

```text
St. John Vianney Secondary School
Term 1 Exam Results for John Doe

Average: 75.50%
Division: II
Points: 18
Rank: 5 out of 30

Subject Marks:
Mathematics: 85 (A)
English: 78 (B)
Physics: 72 (B)
Chemistry: 68 (B)
Biology: 65 (B)
...

For complete results, please contact the school.
```

## Parent Contacts

To send SMS messages to parents, you need to add parent contacts for each student. You can do this through the admin interface:

1. Go to Students > View Student
2. Click on "Parent Contacts"
3. Add parent contacts with their phone numbers

## Troubleshooting

If you encounter issues with the SMS integration:

1. Check that the environment variables are set correctly
2. Verify that you have sufficient credits in your Africa's Talking account
3. Check the phone number format (should be in international format, e.g., +255712345678)
4. Check the server logs for error messages

## SMS Costs

Africa's Talking charges per SMS sent. The cost depends on:

- The destination country
- The length of the message
- The volume of messages sent

For current pricing, check the [Africa's Talking pricing page](https://africastalking.com/pricing).

## Free Trial

Africa's Talking offers a free trial with:

- Free sandbox environment for testing
- Free credits for new accounts
- Pay-as-you-go pricing for production use

This makes it an ideal solution for schools with limited budgets.
