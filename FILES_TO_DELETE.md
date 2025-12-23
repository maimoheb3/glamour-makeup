# Files and Directories to Delete

This document lists all files and directories that are **NOT needed** for the current vanilla JS frontend + Node.js backend setup. These are leftover from the React conversion or unused files.

## 🗑️ SAFE TO DELETE - Entire Directories

### 1. `src/` directory (ENTIRE DIRECTORY)
**Reason:** This is the old React frontend code. Everything has been converted to vanilla JS in `public/` directory.
- `src/App.js`
- `src/App.css`
- `src/App.test.js`
- `src/index.js`
- `src/index.css`
- `src/logo.svg`
- `src/reportWebVitals.js`
- `src/setupTests.js`
- `src/assets/` (duplicate assets, already in `public/assets/`)
- `src/components/` (all React components)
- `src/pages/` (all React pages)

### 2. `build/` directory (if it exists)
**Reason:** React build output. Not needed since we're using vanilla JS served from `public/`.

### 3. Root `node_modules/` directory
**Reason:** Contains React dependencies that are no longer needed. The backend has its own `node_modules/` in `backend/` folder.

## 🗑️ SAFE TO DELETE - Individual Files

### Root Directory Files:
- `package-lock.json` (root) - Only needed if you keep root package.json for React
- `package.json` (root) - Contains React dependencies, not needed if you only use backend package.json

**Note:** If you want to keep a root package.json for convenience (to run `npm start` from root), you can keep it but remove React dependencies.

### Backend Files:
- `backend/app.js` - Not used (server.js is the main entry point)
- `backend/jest.config.js` - Testing config, not needed if not running tests
- `backend/scripts/test-db-connection.js` - Test script, not needed for production

### Documentation Files (Optional - Keep if you want reference):
- `BRAND_PAGE_FIX.md`
- `COMPLETE_CONVERSION_SUMMARY.md`
- `CONVERSION_COMPLETE.md`
- `DATABASE_INTEGRATION.md`
- `FINAL_STATUS.md`
- `FINAL_VERIFICATION.md`
- `PORT_CONFIGURATION.md`
- `SIGNUP_FIX.md`
- `VERIFICATION_SUMMARY.md`

**Keep:** `README.md` and `DESIGN_PATTERNS.md` (useful documentation)

## ✅ KEEP - Essential Files

### Root:
- `README.md` - Project documentation
- `DESIGN_PATTERNS.md` - Design patterns documentation
- `.env` (if exists) - Environment variables
- `.gitignore` (if exists) - Git ignore rules

### Backend:
- `backend/server.js` - Main server file
- `backend/package.json` - Backend dependencies
- `backend/package-lock.json` - Backend dependency lock
- `backend/.env` - Backend environment variables
- `backend/config/` - All config files (db.js, multer.js)
- `backend/controllers/` - All controllers
- `backend/middlewares/` - All middlewares
- `backend/models/` - All models
- `backend/routes/` - All routes
- `backend/validators/` - All validators
- `backend/public/uploads/` - Uploaded images directory

### Public (Frontend):
- `public/` - Entire directory (this is your current frontend)
  - `public/index.html`
  - `public/css/` - All CSS files
  - `public/js/` - All JavaScript files
  - `public/assets/` - All image assets

## 📝 Summary

**Total to delete:**
1. `src/` directory (entire folder)
2. `build/` directory (if exists)
3. Root `node_modules/` (if you delete root package.json)
4. Root `package.json` and `package-lock.json` (optional - only if you don't need root npm scripts)
5. `backend/app.js`
6. `backend/jest.config.js`
7. `backend/scripts/test-db-connection.js`
8. Documentation .md files (optional)

**After deletion, your project structure should be:**
```
project-root/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── validators/
│   ├── public/uploads/
│   ├── package.json
│   ├── package-lock.json
│   ├── server.js
│   └── .env
├── public/
│   ├── assets/
│   ├── css/
│   ├── js/
│   └── index.html
├── README.md
├── DESIGN_PATTERNS.md
└── .gitignore (if exists)
```

## ⚠️ Important Notes

1. **Backup before deleting:** Make sure you have a backup or git commit before deleting files.

2. **Root package.json:** If you want to keep the convenience of running `npm start` from the root, keep `package.json` but remove React dependencies and update scripts to just run the backend.

3. **Node modules:** After deleting root `package.json`, you can delete root `node_modules/` to save space.

4. **Documentation:** The .md files are just documentation. You can delete them if you don't need the reference, or keep them for project history.

