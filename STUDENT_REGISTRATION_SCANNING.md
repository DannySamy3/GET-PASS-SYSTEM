# Student Registration Status with Campus Tracking

## Overview
The `getStudentRegistrationStatusById` controller now **requires** a scan type parameter and always performs campus entry/exit tracking. The controller no longer supports getting registration status without scanning.

**Important**: Failed scans (like trying to check-in when already in campus) do NOT create scan records and do NOT show student registration status.

## API Endpoint

### Campus Entry/Exit Tracking (Required)
```
GET /api/students/registration-status/:id?type=ENTRY
GET /api/students/registration-status/:id?type=EXIT
```

**Path Parameters:**
- `id` - Student ID

**Query Parameters:**
- `type=ENTRY` - For check-in (**required**)
- `type=EXIT` - For check-out (**required**)

## How It Works

### Check-in (`type=ENTRY`):
- If the student is registered and currently `OUT_CAMPUS`, the scan is successful
- Student status changes to `IN_CAMPUS`
- If the student is already `IN_CAMPUS`, the scan is rejected

### Check-out (`type=EXIT`):
- If the student is registered and currently `IN_CAMPUS`, the scan is successful
- Student status changes to `OUT_CAMPUS`
- If the student is already `OUT_CAMPUS`, the scan is rejected

### Registration Check
- Only registered students can use the campus tracking system
- Unregistered students will always get a failed scan

## Response Format

### Successful Check-in
```json
{
  "status": "success",
  "data": {
    "registrationStatus": "REGISTERED",
    "scan": {
      "date": "2024-01-01T10:00:00.000Z",
      "status": "COMPLETED",
      "scanType": "ENTRY",
      "campusStatus": "IN_CAMPUS"
    },
    "student": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "firstName": "John",
      "secondName": "Doe",
      "lastName": "Smith",
      "campusStatus": "IN_CAMPUS",
      "lastScanDate": "2024-01-01T10:00:00.000Z",
      // ... other student fields
    },
    "className": "Computer Science"
  },
  "message": "Entry successful! Student is now inside campus."
}
```

### Failed Check-in (Already in Campus)
```json
{
  "status": "fail",
  "message": "Student is already inside campus. They must exit first before entering again."
}
```

### Unregistered Student
```json
{
  "status": "fail",
  "message": "Student registration is incomplete. Please complete registration before accessing campus."
}
```

## Usage Examples

### Check-in a Student
```bash
curl "http://localhost:3000/api/students/registration-status/64f1a2b3c4d5e6f7g8h9i0j1?type=ENTRY"
```

### Check-out a Student
```bash
curl "http://localhost:3000/api/students/registration-status/64f1a2b3c4d5e6f7g8h9i0j1?type=EXIT"
```

### Missing Scan Type (Will Fail)
```bash
curl "http://localhost:3000/api/students/registration-status/64f1a2b3c4d5e6f7g8h9i0j1"
```
**Response:**
```json
{
  "status": "fail",
  "message": "Please specify scan type: 'ENTRY' for entering campus or 'EXIT' for leaving campus"
}
```

### Invalid Scan Type (Will Fail)
```bash
curl "http://localhost:3000/api/students/registration-status/64f1a2b3c4d5e6f7g8h9i0j1?type=INVALID"
```
**Response:**
```json
{
  "status": "fail",
  "message": "Please specify scan type: 'ENTRY' for entering campus or 'EXIT' for leaving campus"
}
```

## Error Handling

### Common Error Responses

1. **Missing Scan Type**
```json
{
  "status": "fail",
  "message": "Please specify scan type: 'ENTRY' for entering campus or 'EXIT' for leaving campus"
}
```

2. **Invalid Scan Type**
```json
{
  "status": "fail",
  "message": "Please specify scan type: 'ENTRY' for entering campus or 'EXIT' for leaving campus"
}
```

3. **Student Not Found**
```json
{
  "status": "fail",
  "message": "Student ID not found in our records. Please check the ID and try again."
}
```

4. **Already in Campus (Check-in)**
```json
{
  "status": "fail",
  "message": "Student is already inside campus. They must exit first before entering again."
}
```

5. **Already out of Campus (Check-out)**
```json
{
  "status": "fail",
  "message": "Student is already outside campus. They must enter first before exiting."
}
```

6. **Student Not Registered**
```json
{
  "status": "fail",
  "message": "Student registration is incomplete. Please complete registration before accessing campus."
}
```

## Key Features

| Feature | Successful Scan | Failed Scan |
|---------|----------------|-------------|
| **Scan Record** | ✅ Created | ❌ Not created |
| **Campus Status Update** | ✅ Updated | ❌ No change |
| **Student Data** | ✅ Shown | ❌ Not shown |
| **Registration Status** | ✅ Shown | ❌ Not shown |
| **Message** | ✅ Success message | ✅ Clear error message |
| **HTTP Status** | 200 | 400 |

## Benefits

1. **Clean Audit Trail**: Only successful scans create records
2. **Security**: Failed scans don't expose student information
3. **Clear Intent**: No ambiguity about what the endpoint does
4. **Data Integrity**: Ensures consistent campus status tracking
5. **Simplified Logic**: No conditional behavior based on parameters
6. **Privacy Protection**: Failed scans don't reveal student details
7. **User-Friendly Messages**: Clear explanations of why scans failed 