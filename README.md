# Health Forge

Health Forge is a comprehensive, full-stack B2B/B2C e-commerce platform tailored for the surgical equipment business. It features a robust public-facing storefront for users to browse and purchase surgical instruments, and a secure, advanced administrative dashboard for managing business operations.

## 🌟 Key Features

### Client Storefront
* **Product Catalog:** Browse a comprehensive range of surgical tools and medical equipment.
* **Shopping Cart & Checkout:** Seamless purchase flow with secure payment gateway integration via Razorpay.
* **User Authentication:** Secure signup and login for customers using JWT.
* **Order Tracking:** Customers can view their order history and current status.
* **Responsive Design:** A polished UI optimized for both desktop and mobile devices.

### Admin Dashboard
* **Advanced Analytics:** Gain data-driven insights into sales, orders, and user engagement with visual charts.
* **Order Management:** Detailed workflow for processing orders with real-time inventory synchronization.
* **Inventory Control:** Manage product listings, update stock levels, and categorize items.
* **Coupon System:** Robust discount engine supporting site-wide discounts, usage limits, and discount caps.
* **User Management:** Interface for managing customer accounts and administrative roles with pagination.
* **Role-Based Access Control:** Strict security ensuring administrative features are isolated from public access.

## 🛠️ Technology Stack

### Frontend (Client & Admin Apps)
* **React:** Modern UI library for building dynamic interfaces.
* **Vite:** Next-generation frontend tooling for ultra-fast development and optimized builds.
* **React Router:** Declarative routing for single-page applications.
* **Recharts:** Composable charting library for rendering admin analytics.

### Backend (REST API)
* **Node.js & Express.js:** Fast web framework for Node.js.
* **PostgreSQL:** Powerful, open-source relational database system.
* **Authentication:** JSON Web Tokens (JWT) and bcryptjs for secure password hashing.
* **Cloudinary:** Cloud-based media management for product images.
* **Razorpay:** Secure payment gateway integration.
* **Resend / Nodemailer:** Delivery of transactional emails and notifications.
* **PDFKit:** Dynamic PDF generation for invoices and reports.

## 📂 Project Structure

The repository is structured as a monorepo containing three main workspaces:

```text
Health-Forge/
├── admin-client/    # React SPA for the secure administrative dashboard
├── client/          # React SPA for the public-facing e-commerce storefront
└── server/          # Express.js REST API backend
```

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher recommended)
* PostgreSQL Database
* Cloudinary Account
* Razorpay Account (for payment processing)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kashyapgaurav22/Health-Forge.git
   cd Health-Forge
   ```

2. **Setup the Server:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server` directory and configure your environment variables (e.g., Database connection string, JWT Secret, Cloudinary credentials, Razorpay keys).
   Start the development server:
   ```bash
   npm run dev
   ```

3. **Setup the Client Storefront:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

4. **Setup the Admin Dashboard:**
   ```bash
   cd ../admin-client
   npm install
   npm run dev
   ```

## 📄 License
This project is licensed under the ISC License.
