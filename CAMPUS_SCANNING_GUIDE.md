# Campus Entry/Exit Scanning System

## Overview
The campus scanning system now tracks when students enter and exit the university campus. The system prevents duplicate check-ins and ensures proper entry/exit flow.

## How It Works

### 1. Initial Entry (Check-in)
- When a student's card is scanned for the first time with `type=ENTRY`
- If the student is currently `OUT_CAMPUS`, the scan is successful
- Student status changes to `IN_CAMPUS`
- If the student is already `IN_CAMPUS`, the scan is rejected

### 2. Subsequent Check-in Attempts
- If a student tries to check-in while already in campus, the system rejects the scan
- Error message: "Student is already in campus. Please check-out first before checking in again."

### 3. Check-out (Exit)
- When a student's card is scanned with `type=EXIT`
- If the student is currently `IN_CAMPUS`, the scan is successful
- Student status changes to `OUT_CAMPUS`
- If the student is already `OUT_CAMPUS`, the scan is rejected

### 4. Re-entry After Check-out
- After a successful check-out, the student can check-in again
- The cycle repeats

## API Endpoints

### 1. Scan Card (Entry/Exit)
```
POST /api/scan/scan?type=ENTRY
POST /api/scan/scan?type=EXIT
```

**Request Body:** JPEG image containing QR code

**Query Parameters:**
- `type=ENTRY` - For check-in
- `type=EXIT` - For check-out

**Response:**
```json
{
  "status": "success",
  "data": {
    "scan": {
      "date": "2024-01-01T10:00:00.000Z",
      "status": "COMPLETED",
      "scanType": "ENTRY",
      "campusStatus": "IN_CAMPUS",
      "student": {
        "firstName": "John",
        "secondName": "Doe",
        "lastName": "Smith",
        "campusStatus": "IN_CAMPUS"
      }
    }
  },
  "message": "Check-in successful. Student is now in campus."
}
```

### 2. Get Student Campus Status
```
GET /api/scan/campus-status/:studentId
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "student": {
      "firstName": "John",
      "secondName": "Doe",
      "lastName": "Smith",
      "campusStatus": "IN_CAMPUS",
      "lastScanDate": "2024-01-01T10:00:00.000Z"
    }
  }
}
```

### 3. Get All Students Campus Status
```
GET /api/scan/campus-status
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "students": [
      {
        "firstName": "John",
        "secondName": "Doe",
        "lastName": "Smith",
        "campusStatus": "IN_CAMPUS",
        "lastScanDate": "2024-01-01T10:00:00.000Z",
        "regNo": "CS/24/001"
      }
    ],
    "campusStats": {
      "inCampus": 150,
      "outCampus": 50,
      "total": 200
    }
  }
}
```

## Database Schema Changes

### Scan Model
- Added `scanType`: ENTRY or EXIT
- Added `campusStatus`: IN_CAMPUS or OUT_CAMPUS

### Student Model
- Added `campusStatus`: Current campus status
- Added `lastScanDate`: Date of last scan

## Usage Examples

### Check-in a Student
```bash
curl -X POST "http://localhost:3000/api/scan/scan?type=ENTRY" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@student_qr_code.jpg"
```

### Check-out a Student
```bash
curl -X POST "http://localhost:3000/api/scan/scan?type=EXIT" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@student_qr_code.jpg"
```

### Check Student Status
```bash
curl "http://localhost:3000/api/scan/campus-status/64f1a2b3c4d5e6f7g8h9i0j1"
```

## Error Handling

### Common Error Responses

1. **Student Already in Campus (Check-in)**
```json
{
  "status": "fail",
  "message": "Student is already in campus. Please check-out first before checking in again."
}
```

2. **Student Already out of Campus (Check-out)**
```json
{
  "status": "fail",
  "message": "Student is already out of campus. Please check-in first before checking out."
}
```

3. **Missing Scan Type**
```json
{
  "status": "fail",
  "message": "Scan type is required. Use 'type=ENTRY' for check-in or 'type=EXIT' for check-out"
}
```

4. **Student Not Registered**
```json
{
  "status": "fail",
  "message": "Student is not registered"
}
```

## Security Features

1. **Registration Check**: Only registered students can use the scanning system
2. **Status Validation**: Prevents invalid state transitions
3. **Audit Trail**: All scans are logged with timestamps and status changes
4. **Data Integrity**: Campus status is updated atomically with scan records

## Benefits

1. **Prevents Duplicate Check-ins**: Students cannot check-in multiple times without checking out
2. **Accurate Campus Population**: Real-time tracking of who is currently in campus
3. **Audit Trail**: Complete history of entry/exit events
4. **Flexible Workflow**: Supports both entry and exit scanning
5. **Error Prevention**: Clear error messages guide proper usage 