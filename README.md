# F1 Analysis Platform

A comprehensive web application for Formula 1 data analysis, providing engineers and enthusiasts with advanced telemetry visualization, race strategy analysis, and performance comparison tools.

## Features

- **Real-time and Historical Data**: Access telemetry data from multiple F1 API sources
- **Interactive Visualizations**: Telemetry charts, track maps, and strategy timelines
- **Performance Analysis**: Compare drivers, analyze setups, and identify performance gaps
- **Strategy Simulation**: Optimize pit stop timing and tire selection
- **Local Caching**: Intelligent IndexedDB caching for fast data access
- **Responsive Design**: Optimized for desktop and tablet devices

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Query
- **Visualization**: Plotly.js, D3.js, Recharts
- **Database**: IndexedDB (via Dexie.js)
- **Testing**: Vitest, React Testing Library, fast-check (property-based testing)
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd f1panopticon
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage report

## Project Structure

```
src/
├── components/       # React components
├── services/         # API clients and business logic
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── config/           # Configuration (database, constants)
├── test/             # Test setup and utilities
├── App.tsx           # Main application component
└── main.tsx          # Application entry point
```

## Development Guidelines

1. **TypeScript Strict Mode**: All code uses TypeScript strict mode
2. **Code Quality**: Follow ESLint and Prettier configurations
3. **Testing**: Write tests for all new features
4. **Property-Based Testing**: Use fast-check for universal properties
5. **Component Design**: Keep components small and focused
6. **Custom Hooks**: Use custom hooks for complex state logic

## Testing

The project uses a comprehensive testing approach:

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Property-Based Tests**: Verify universal properties with fast-check

Run tests with:
```bash
npm test
```

## API Data Sources

- **FastF1**: Telemetry data (2018-present)
- **Ergast**: Race results and lap times (1950-present)
- **OpenF1**: Live session data (2023-present)

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Getting Started Guide](./docs/GETTING_STARTED.md)** - Installation, setup, and troubleshooting
- **[Feature Documentation](./docs/FEATURES.md)** - Complete guide to all features
- **[API Configuration](./docs/API_CONFIGURATION.md)** - API setup and tier information
- **[Data Export Guide](./docs/DATA_EXPORT.md)** - Export formats and report generation
- **[Developer Guide](./docs/DEVELOPER.md)** - Architecture and contribution guidelines

## Screenshots

### Session Browser
Browse and filter F1 sessions by season, race, and driver.

### Telemetry Analysis
Interactive telemetry charts with synchronized track map visualization.

### Strategy Analysis
Analyze pit stop strategies and tire degradation patterns.

### Driver Comparison
Compare driver performance with synchronized telemetry overlays.

## Performance

- **Fast Load Times**: Intelligent caching reduces API calls
- **Responsive UI**: Smooth interactions even with large datasets
- **Optimized Rendering**: Canvas-based rendering for high-frequency data
- **Progressive Loading**: Display data as it becomes available

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick deploy options:
- **Netlify**: `netlify deploy --prod --dir=dist`
- **Vercel**: `vercel --prod`
- **Docker**: `docker build -t f1panopticon . && docker run -p 8080:80 f1panopticon`

## Roadmap

### Phase 2
- Real-time collaboration features
- Machine learning for setup recommendations
- Advanced strategy optimization algorithms
- Weather impact analysis

### Phase 3
- Offline mode with full functionality
- Custom telemetry channel creation
- Integration with racing simulators
- Community sharing platform

## Acknowledgments

- **FastF1**: For providing comprehensive F1 telemetry data
- **Ergast**: For historical F1 race data
- **OpenF1**: For live session data
- The F1 community for inspiration and feedback

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/f1panopticon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/f1panopticon/discussions)
- **Documentation**: [docs/](./docs/)

## License

MIT License - see [LICENSE](./LICENSE) file for details.

Copyright (c) 2024 F1 Panopticon Contributors

## Contributing

Contributions are welcome! Please read the [Developer Documentation](./docs/DEVELOPER.md) for guidelines on:
- Setting up your development environment
- Code style and standards
- Testing requirements
- Pull request process

To contribute:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
