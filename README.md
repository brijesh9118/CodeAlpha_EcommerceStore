# CodeAlpha E-commerce Store

A beginner-friendly full-stack e-commerce demo for **CodeAlpha Full Stack Development Task 1**.

## Features

- Product listing with category filters and search
- Product detail dialog
- Shopping cart with quantity controls and subtotal
- User registration and login
- Password hashing with `bcryptjs`
- Session-based authentication
- Server-side order processing and stock checks
- JSON-file persistence for products, users, and orders
- Responsive layout for desktop and mobile

> This is a learning/demo project. It does not collect real payments. JSON files and the default session secret are not suitable for production deployment.

## Requirements

- Node.js LTS (npm is included)
- A web browser
- Internet is only needed to install npm dependencies and load the optional Google Font.

## Run on Windows

1. Install Node.js LTS from https://nodejs.org/
2. Close and reopen PowerShell or VS Code after installation.
3. Open PowerShell in this project folder (the folder containing `package.json`).
4. Check installation:

   ```powershell
   node -v
   npm -v
   ```

5. Install dependencies:

   ```powershell
   npm install
   ```

6. Start the app:

   ```powershell
   npm start
   ```

7. Open http://localhost:3000 in your browser.

Keep the terminal open while using the app. To stop the server, press `Ctrl + C`.

## Try the features

1. Search for a product or choose a category.
2. Open product details and add a product to your cart.
3. Change quantities or remove products from the cart.
4. Choose **Login / Sign up**, create an account with an email and password of at least 8 characters.
5. Return to the cart and choose **Place order**.
6. The order is saved in `data/orders.json` and stock is reduced in `data/products.json`.
7. Registered users are stored in `data/users.json` with hashed passwords, not plain-text passwords.

## Project structure

```text
CodeAlpha_EcommerceStore/
├── data/
│   ├── products.json
│   ├── users.json       # created when first needed; do not commit real user data
│   └── orders.json      # created when first needed; do not commit real order data
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server status |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get one product |
| GET | `/api/auth/me` | Get the current logged-in user |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Log in |
| POST | `/api/auth/logout` | Log out |
| POST | `/api/orders` | Place an order (login required) |

## Upload to GitHub

Create a repository named `CodeAlpha_EcommerceStore` (or another name required by your internship instructions). Do not upload `node_modules`, real user data, or order data.

In PowerShell, from the project folder:

```powershell
git init
git add .
git commit -m "Build CodeAlpha e-commerce store"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/CodeAlpha_EcommerceStore.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Create the empty repository on GitHub first. If Git asks you to sign in, follow the browser sign-in prompt.

If you already connected a different repository, inspect it with `git remote -v` before running `git remote add origin`.

## LinkedIn submission checklist

1. Share a short internship status post and tag `@CodeAlpha`.
2. Record a 1–3 minute demo showing the home page, product search/category filter, product details, cart quantity changes, account registration/login, and placing a test order.
3. Upload the video to LinkedIn. Add your GitHub repository link to the post.
4. Use an honest caption describing the features you actually tested.
5. Submit the completed project using the submission form shared in your internship WhatsApp group.
6. The provided CodeAlpha task PDF says at least two or three tasks must be completed for the internship certificate. Check your coordinator's latest instructions about the exact number.

## Before sharing publicly

- Use test data only.
- Never publish passwords, API keys, `.env` files, or personal customer data.
- Replace the demo session secret and use HTTPS, a production session store, a real database, input validation, and other security controls before any real deployment.
