# AdScreen Global - Digital Advertisement Platform

AdScreen is a digital advertisement platform that allows advertisers to upload and display their advertisements on screens around the world. This repository contains the complete MVP (Minimum Viable Product) for setting up the platform.

![AdScreen Platform](docs/adscreen-diagram.png)

## Key Features

- **Web-based Interface**: Intuitive interface for advertisers to upload and manage advertisements
- **Global Screen Network**: Support for various digital screens in different locations
- **Scheduling System**: Schedule advertisements on specific screens with date and time targeting
- **Real-time Distribution**: Automatic content distribution to screens when advertisements are approved
- **PC Stick Client**: Lightweight Electron application for screen display devices

## System Architecture

The AdScreen platform uses a modern, serverless architecture built on AWS:

1. **Frontend**: React-based web application
2. **Backend**: AWS API Gateway and Lambda functions
3. **Database**: Amazon DynamoDB for user data, advertisements, screens, and schedules
4. **Storage**: Amazon S3 for advertisement content
5. **IoT Communication**: AWS IoT Core for real-time communication with screens
6. **Client Application**: Electron application deployed on Intel PC Stick devices

## Repository Structure

```
adscreen-platform/
├── frontend/            # Web interface (React)
├── lambda_functions/    # AWS Lambda functions
├── pc-stick-client/     # Electron app for screen devices
├── scripts/             # Utility scripts
├── terraform/           # Infrastructure as code
├── DEPLOYMENT.md        # Detailed deployment instructions
└── README.md            # This file
```

## Quick Start

For detailed setup instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

1. **Deploy infrastructure**:
   ```
   cd terraform
   terraform init
   terraform apply
   ```

2. **Package Lambda functions**:
   ```
   ./scripts/package-lambdas.sh
   ```

3. **Set up initial data**:
   ```
   ./scripts/seed-data.js
   ```

4. **Configure screens**:
   ```
   ./scripts/setup-screen.js
   ```

5. **Deploy PC Stick client**:
   ```
   cd pc-stick-client
   npm install
   npm run build:win  # or build:linux
   ```

## MVP Scope and Limitations

This MVP focuses on core functionality:

- Basic user authentication (simplified for MVP)
- Advertisement uploading and scheduling
- Screen management and content distribution
- Real-time display on PC Stick devices

Future versions will include:
- Advanced analytics and reporting
- Audience targeting
- Content moderation
- Multi-region deployment
- Mobile application

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or inquiries, please contact the AdScreen team at support@adscreen-example.com.