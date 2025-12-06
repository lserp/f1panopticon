# Contributing to F1 Panopticon

Thank you for your interest in contributing to F1 Panopticon! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing others' private information
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A code editor (VS Code recommended)
- Basic knowledge of React, TypeScript, and F1 data

### Setting Up Your Development Environment

1. Fork the repository on GitHub

2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/f1panopticon.git
cd f1panopticon
```

3. Add the upstream repository:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/f1panopticon.git
```

4. Install dependencies:
```bash
npm install
```

5. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

6. Start the development server:
```bash
npm run dev
```

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/add-lap-comparison`)
- `fix/` - Bug fixes (e.g., `fix/telemetry-sync-issue`)
- `docs/` - Documentation updates (e.g., `docs/update-api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-cache-logic`)
- `test/` - Test additions or updates (e.g., `test/add-strategy-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Keeping Your Fork Updated

Regularly sync your fork with the upstream repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define explicit types for function parameters and return values
- Avoid `any` type - use `unknown` or proper types
- Use interfaces for object shapes
- Use type aliases for unions and complex types

### React

- Use functional components with hooks
- Keep components small and focused (< 200 lines)
- Extract complex logic into custom hooks
- Use meaningful component and prop names
- Implement proper error boundaries

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### File Organization

```
src/
├── components/       # Reusable UI components
│   ├── ComponentName.tsx
│   ├── ComponentName.css
│   └── ComponentName.test.tsx
├── services/         # API clients and business logic
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── utils/            # Pure utility functions
└── config/           # Configuration files
```

### Naming Conventions

- **Components**: PascalCase (e.g., `TelemetryChart.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useLapQuery.ts`)
- **Utilities**: camelCase (e.g., `formatLapTime.ts`)
- **Types**: PascalCase (e.g., `SessionData`, `LapData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_CACHE_SIZE`)

## Testing Guidelines

### Test Coverage

All new features must include tests:

- **Unit tests** for individual functions and components
- **Integration tests** for component interactions
- **Property-based tests** for universal properties

### Writing Tests

```typescript
// Unit test example
import { describe, it, expect } from 'vitest';
import { calculateLapDelta } from './analysisEngine';

describe('calculateLapDelta', () => {
  it('should calculate correct delta between laps', () => {
    const lap1 = { lapTime: 90.5 };
    const lap2 = { lapTime: 91.2 };
    const delta = calculateLapDelta(lap1, lap2);
    expect(delta).toBe(0.7);
  });
});
```

```typescript
// Property-based test example
import { fc, test } from 'fast-check';

test.prop([fc.array(fc.float())])('filtering should not increase array length', (data) => {
  const filtered = filterData(data, () => true);
  expect(filtered.length).toBeLessThanOrEqual(data.length);
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Requirements

- All tests must pass before submitting a PR
- Maintain or improve code coverage
- Test edge cases and error conditions
- Use descriptive test names

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(telemetry): add multi-lap overlay support

Implement functionality to overlay up to 4 laps on telemetry charts
with synchronized distance axes.

Closes #123
```

```
fix(cache): resolve IndexedDB quota exceeded error

Add proper error handling and LRU eviction when storage quota is reached.

Fixes #456
```

### Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues and PRs in the footer

## Pull Request Process

### Before Submitting

1. Ensure all tests pass:
```bash
npm test
```

2. Check code formatting:
```bash
npm run lint
npm run format:check
```

3. Update documentation if needed

4. Add tests for new features

5. Update CHANGELOG.md (if applicable)

### Submitting a Pull Request

1. Push your changes to your fork:
```bash
git push origin feature/your-feature-name
```

2. Go to the original repository on GitHub

3. Click "New Pull Request"

4. Select your fork and branch

5. Fill out the PR template:
   - Clear description of changes
   - Link to related issues
   - Screenshots (if UI changes)
   - Testing performed

### PR Review Process

- Maintainers will review your PR
- Address any requested changes
- Once approved, your PR will be merged
- Your contribution will be credited in the release notes

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] PR description is clear and complete

## Reporting Bugs

### Before Reporting

1. Check existing issues to avoid duplicates
2. Verify the bug in the latest version
3. Collect relevant information

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., macOS 13.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

**Additional context**
Any other relevant information.
```

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other context, mockups, or examples.
```

### Feature Discussion

- Open a GitHub Discussion for major features
- Get feedback before implementing
- Consider impact on existing functionality
- Think about backwards compatibility

## Development Tips

### Debugging

- Use React DevTools for component inspection
- Use browser DevTools for network and performance
- Check IndexedDB in Application tab
- Use `console.log` in development (removed in production)

### Performance

- Profile components with React DevTools Profiler
- Monitor bundle size with build output
- Test with large datasets
- Check memory usage in DevTools

### Accessibility

- Test with keyboard navigation
- Use screen reader for testing
- Verify color contrast ratios
- Add ARIA labels where needed

## Questions?

- Check the [documentation](./docs/)
- Ask in [GitHub Discussions](https://github.com/yourusername/f1panopticon/discussions)
- Review existing issues and PRs

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- GitHub contributors page

Thank you for contributing to F1 Panopticon! 🏎️
