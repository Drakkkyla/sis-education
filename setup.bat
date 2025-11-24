@echo off
chcp 65001 >nul
echo ========================================
echo SIS Education Platform - Setup
echo ========================================
echo.

echo Step 1: Installing root dependencies...
call npm install

echo.
echo Step 2: Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Step 3: Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo Step 4: Creating backend .env file...
cd backend
if not exist .env (
    echo Creating .env file...
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/sis-education
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=10485760
    ) > .env
    echo .env file created!
) else (
    echo .env file already exists, skipping...
)
cd ..

echo.
echo Step 5: Seeding database...
cd backend
echo Make sure MongoDB is running before seeding!
echo Press any key to continue or Ctrl+C to cancel...
pause >nul
call npm run seed
cd ..

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo To start the application:
echo   1. Start MongoDB (if not running)
echo   2. Run: start-backend.bat (in one terminal)
echo   3. Run: start-frontend.bat (in another terminal)
echo.
echo Or use: npm run dev (from root directory)
echo.

