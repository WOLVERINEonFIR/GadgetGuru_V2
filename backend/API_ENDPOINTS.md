# GadgetGuru API Endpoints Documentation

This document provides a complete reference for all API endpoints in the GadgetGuru backend service. All endpoints are built with FastAPI and respond with structured JSON.

## General Response Format

All successful responses follow this structure:
```json
{
  "success": true,
  "data": { /* endpoint-specific data */ },
  /* optional metadata fields depending on endpoint */
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## System Health Endpoints

### Root Status
- **GET** `/`
- **Auth**: None (anonymous)
- **Response**: 
  ```json
  {
    "status": "API working"
  }
  ```

### Health Check
- **GET** `/health`
- **Auth**: None (anonymous)
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

---

## Device Discovery Endpoints

### Get All Phones (with Filters)
- **GET** `/api/phones`
- **Auth**: None (anonymous)
- **Query Parameters**:
  - `max_price` (integer, >= 0): Maximum price filter in INR
  - `min_gaming_score` (integer, >= 0): Minimum gaming performance score
  - `min_camera_score` (integer, >= 0): Minimum camera quality score
  - `min_battery_score` (integer, >= 0): Minimum battery life score
  - `min_display_score` (integer, >= 0): Minimum display quality score
  - `limit` (integer, default: 2000, 1-10000): Maximum number of results to return
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "ObjectId string",
        "model_name": "string",
        "brand": "string",
        "model": "string",
        "device_type": "phone",
        "status": "available",
        "filter": {
          "price_min_inr": integer,
          "has_price_data": boolean
        },
        "price": {
          "sale": integer,
          "mrp": integer
        },
        "scores": {
          "gaming": integer,
          "camera": integer,
          "battery": integer,
          "display": integer
        },
        "ram": [string],
        "storage": [string],
        "battery": {
          "capacity": integer,
          "type": "string"
        }
      }
    ]
  }
  ```

### Get All Laptops (with Filters)
- **GET** `/api/laptops`
- **Auth**: None (anonymous)
- **Query Parameters**:
  - `max_price` (integer, >= 0): Maximum price filter in INR
  - `limit` (integer, default: 1000, 1-2000): Maximum number of results to return
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "ObjectId string",
        "model_name": "string",
        "brand": "string",
        "device_type": "laptop",
        "status": "available",
        "filter": {
          "price_min_inr": integer,
          "has_price_data": boolean
        },
        "price": {
          "sale": integer,
          "mrp": integer
        }
      }
    ]
  }
  ```

---

## Search and Recommendation Endpoints

### Get Phone Recommendations by Priority (Query Param)
- **GET** `/api/recommend?priority=<priority>`
- **Auth**: None (anonymous)
- **Query Parameters**:
  - `priority` (string, required): One of `gaming | camera | battery | performance`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "source": "database | api",
      "results": [
        {
          "_id": "ObjectId string",
          "brand": "string",
          "model": "string",
          "price": {
            "sale": integer,
            "mrp": integer
          },
          "ram": [string],
          "storage": [string]
        }
      ]
    }
  }
  ```
- **Errors**:
  - 400: Invalid priority value provided
  - 404: No matching phones found
  - 502: External API failed and no database fallback available
  - 503: Database unavailable

### Search Phones with Filters (POST)
- **POST** `/api/search`
- **Auth**: None (anonymous)
- **Request Body**:
  ```json
  {
    "brand": "string (optional)",
    "max_price": integer (optional, >= 0),
    "ram": "string (optional)",
    "storage": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "source": "database | api",
      "results": [
        {
          "_id": "ObjectId string",
          "brand": "string",
          "model": "string",
          "price": {
            "sale": integer,
            "mrp": integer
          },
          "ram": [string],
          "storage": [string],
          "battery": {
            "capacity": integer,
            "type": "string"
          }
        }
      ]
    }
  }
  ```
- **Logic**: 
  - First attempts to fetch from database with provided filters
  - On miss, queries external RapidAPI for specifications and saves results to database
  - Returns whichever source has matching results
- **Errors**:
  - 404: No matching phones found in database or external API
  - 502: External API failed and no database results available
  - 503: Database unavailable

### Recommend Phones (POST - Enhanced with Ranking)
- **POST** `/api/recommend`
- **Auth**: None (anonymous)
- **Request Body** (RecommendRequest):
  ```json
  {
    "brand": "string (optional)",
    "max_price": integer (optional, >= 0),
    "ram": "string (optional)",
    "storage": "string (optional)"
  }
  ```
- **Response**: Same format as Search Phones endpoint

### Get Ranked Phone Recommendations (POST)
- **POST** `/api/recommendations`
- **Auth**: None (anonymous)
- **Request Body** (RecommendationRequest):
  ```json
  {
    "device_type": "phone (required, currently only phones supported)",
    "priority": "string (optional, default: balanced)",
    "priorities": ["string (optional array)"],
    "maxPrice": integer (optional, default: 30000),
    "strictMode": boolean (optional, default: true),
    "isStrict": boolean (optional, alternative to strictMode)",
    "minRam": integer (optional, >= 0, default: 0),
    "minStorage": integer (optional, >= 0, default: 0),
    "limit": integer (optional, 1-200, default: 20),
    "brand": "string (optional)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "recommendations": [
        {
          "_id": "ObjectId string",
          "model_name": "string",
          "brand": "string",
          "price": { "sale": integer, "mrp": integer },
          "scores": { "gaming": integer, "camera": integer, "battery": integer, "display": integer },
          "selectedVariant": {
            "ram_gb": integer,
            "storage_gb": integer
          }
        }
      ],
      "results": [/* same as recommendations */],
      "count": integer,
      "source": "backend-phone-ranking",
      "filters": {
        "priority": "string",
        "priorities": ["string"],
        "max_price": integer,
        "strictMode": boolean,
        "minRam": integer,
        "minStorage": integer
      }
    }
  }
  ```
- **Processing Pipeline**:
  1. Loads rankable phone devices filtered by brand and maxPrice
  2. Applies phone ranking algorithm based on priorities
  3. Filters results based on minRam and minStorage requirements
  4. Returns top N devices based on limit parameter
- **Errors**:
  - 400: Unsupported device_type (only "phone" supported)
  - 503: Database unavailable

---

## Device Specifications Endpoints

### Get Phone Specifications from External API
- **GET** `/api/specs`
- **Auth**: None (anonymous)
- **Query Parameters**: None
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "brand": "string",
        "model": "string",
        "price": {
          "sale": integer,
          "mrp": integer
        },
        "ram": [string],
        "storage": [string],
        "battery": {
          "capacity": integer,
          "type": "string (optional)"
        }
      }
    ]
  }
  ```
- **Source**: Fetched from RapidAPI Smart Phone API endpoint
- **Errors**:
  - 500: RAPIDAPI_KEY environment variable not configured
  - 502: RapidAPI request failed or returned invalid data

---

## Device Comparison Endpoints

### Compare Multiple Devices
- **POST** `/api/compare-devices`
- **Auth**: None (anonymous)
- **Request Body** (CompareDevicesRequest):
  ```json
  {
    "device_ids": ["string (ObjectId or model identifier)", "..."],
    "intent": "string (optional, default: balanced)"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "intent": "string",
      "count": integer,
      "devices": [
        {
          "_id": "ObjectId string",
          "model_name": "string",
          "brand": "string",
          "model": "string",
          "price": { "sale": integer, "mrp": integer },
          "ram": [string],
          "storage": [string],
          "scores": { "gaming": integer, "camera": integer, "battery": integer, "display": integer }
        }
      ]
    }
  }
  ```
- **Lookup Strategy**:
  - Resolves device_ids by checking multiple fields: `_id`, `model_name`, `model`, `slug`
  - Returns only devices that match the requested identifiers
- **Errors**:
  - 503: Database unavailable

---

## Price Update Endpoints

### Request Price Refresh
- **POST** `/api/refresh-prices`
- **Auth**: None (anonymous)
- **Request Body** (RefreshPricesRequest):
  ```json
  {
    "device_ids": ["string (optional array)"],
    "models": ["string (optional array)"]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "requested": ["string"],
      "updated": {},
      "message": "Price refresh accepted. External refresh worker is not enabled in this FastAPI process."
    }
  }
  ```
- **Notes**: 
  - This endpoint accepts refresh requests but does not immediately update prices
  - Price refresh is handled by an external background worker process
  - Priority: uses `models` parameter if provided, otherwise falls back to `device_ids`

---

## Backward Compatibility Routes

The API provides deprecated compatibility routes that mirror the `/api` endpoints:
- `GET /recommend` → `GET /api/recommend`
- `GET /phones` → `GET /api/phones`
- `GET /laptops` → `GET /api/laptops`
- `POST /recommend` → `POST /api/recommend`
- `POST /recommendations` → `POST /api/recommendations`
- `POST /search` → `POST /api/search`
- `POST /compare-devices` → `POST /api/compare-devices`
- `POST /refresh-prices` → `POST /api/refresh-prices`

All compatibility routes are marked as deprecated and will be removed in future versions.

---

## Error Handling

### HTTP Status Codes
- **200 OK**: Successful request
- **400 Bad Request**: Invalid request parameters or invalid priority value
- **404 Not Found**: No results matching the query criteria
- **500 Internal Server Error**: Unhandled exception or database query error
- **502 Bad Gateway**: External API request failed
- **503 Service Unavailable**: Database connection unavailable (MongoDB not initialized or MONGO_URI issue)

### Error Response Format
```json
{
  "success": false,
  "message": "Description of the error"
}
```

---

## Data Models Reference

### Phone/Device Schema (MongoDB)
```
{
  _id: ObjectId,
  device_type: "phone" | "laptop",
  status: "available" | string,
  model_name: string (unique),
  brand: string,
  model: string,
  slug: string,
  price: {
    sale: number,
    mrp: number
  },
  filter: {
    price_min_inr: number,
    has_price_data: boolean
  },
  ram: [string],
  storage: [string],
  battery: {
    capacity: number,
    type: string
  },
  scores: {
    gaming: number,
    camera: number,
    battery: number,
    display: number
  },
  selectedVariant: {
    ram_gb: number,
    storage_gb: number
  }
}
```

### Request Models (Pydantic)

**RecommendRequest**:
- `brand` (string, optional)
- `max_price` (integer, >= 0, optional)
- `ram` (string, optional)
- `storage` (string, optional)

**RecommendationRequest**:
- `device_type` (string, required, default: "phone")
- `priority` (string, optional, default: "balanced")
- `priorities` (array of strings, default: [])
- `maxPrice` (integer, default: 30000, >= 0)
- `strictMode` (boolean, optional)
- `isStrict` (boolean, optional alternative to strictMode)
- `minRam` (integer, >= 0, default: 0)
- `minStorage` (integer, >= 0, default: 0)
- `limit` (integer, 1-200, default: 20)
- `brand` (string, optional)

**CompareDevicesRequest**:
- `device_ids` (array of strings, default: [])
- `intent` (string, default: "balanced")

**RefreshPricesRequest**:
- `device_ids` (array of strings, default: [])
- `models` (array of strings, default: [])

---

## Configuration & Environment Variables

### Required Variables
- `MONGO_URI`: MongoDB connection string (default uses local MongoDB)
- `DB_NAME`: MongoDB database name

### Optional Variables
- `RAPIDAPI_KEY`: API key for RapidAPI Smart Phone API (required for `/api/specs` endpoint)
- `FRONTEND_ORIGINS`: Comma-separated list of allowed frontend origins for CORS (default: "http://localhost:5173,http://127.0.0.1:5173")

### CORS Settings
- Current configuration allows requests from all origins (configured via FRONTEND_ORIGINS)
- Supports all HTTP methods and headers

---

## Development Notes

### Data Sources
- **Primary**: MongoDB (products collection)
- **Fallback**: Local JSON file (`phones_data.json`)
- **External**: RapidAPI Smart Phone API

### Ranking Priorities
Valid priority values for recommendations:
- `gaming`: High performance gaming phones
- `camera`: Best camera quality phones
- `battery`: Long battery life phones
- `performance`: Latest flagship performance phones

### Database Collections
- `products`: Device inventory (phones, laptops)

### Response Serialization
- MongoDB ObjectId fields are serialized to strings
- DateTime fields are converted to ISO 8601 format
- Floating point numbers (prices) are converted to integers
