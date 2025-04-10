#!/bin/bash

# Script to package Lambda functions for Terraform deployment

# Create output directory
mkdir -p lambda_functions

# Package ad_submission_handler
echo "Packaging ad_submission_handler..."
cd lambda_functions/ad_submission_handler
npm install --production
zip -r ../../lambda_functions/ad_submission_handler.zip .
cd ../..

# Package screen_registration_handler
echo "Packaging screen_registration_handler..."
cd lambda_functions/screen_registration_handler
npm install --production
zip -r ../../lambda_functions/screen_registration_handler.zip .
cd ../..

# Package get_screens_handler
echo "Packaging get_screens_handler..."
cd lambda_functions/get_screens_handler
npm install --production
zip -r ../../lambda_functions/get_screens_handler.zip .
cd ../..

# Package get_user_ads_handler
echo "Packaging get_user_ads_handler..."
cd lambda_functions/get_user_ads_handler
npm install --production
zip -r ../../lambda_functions/get_user_ads_handler.zip .
cd ../..

echo "Lambda packaging complete."