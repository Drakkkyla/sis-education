@echo off
chcp 65001 >nul
echo Creating .env file for backend...
cd backend
if not exist .env (
    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/sis-education
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo JWT_EXPIRE=7d
        echo NODE_ENV=development
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=10485760
    ) > .env
    echo .env file created successfully!
) else (
    echo .env file already exists!
)
cd ..
pause

