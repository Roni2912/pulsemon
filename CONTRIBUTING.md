# Contributing to PulseMon

Thank you for your interest in contributing to PulseMon! We welcome contributions from the community.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node version, browser)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please:
- Check existing issues first to avoid duplicates
- Clearly describe the feature and its use case
- Explain why it would be valuable to users

### Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/Roni2912/pulsemon.git
   cd pulsemon
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Set up development environment**
   - Follow the setup instructions in [README.md](README.md)
   - Ensure all tests pass before making changes

4. **Make your changes**
   - Follow existing code style and patterns
   - Add comments for complex logic
   - Update documentation if needed

5. **Test your changes**
   ```bash
   npm run lint
   npm run build
   ```

6. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commit format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

7. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

### File Organization

```
src/
├── app/              # Next.js app router pages
├── components/       # React components
│   ├── ui/          # Reusable UI components
│   └── dashboard/   # Feature-specific components
├── lib/             # Utilities and helpers
│   ├── supabase/   # Database clients
│   ├── resend/     # Email functionality
│   └── utils/      # Helper functions
└── types/           # TypeScript type definitions
```

### Component Guidelines

- Use functional components with hooks
- Keep components small and reusable
- Separate business logic from presentation
- Use proper TypeScript types
- Handle loading and error states

### API Route Guidelines

- Use proper HTTP status codes
- Validate all inputs with Zod schemas
- Handle errors gracefully
- Return consistent response formats
- Add authentication checks

### Database Guidelines

- Use Supabase RLS policies for security
- Write migrations for schema changes
- Test queries with different user roles
- Optimize queries for performance

## Project Structure

- `/src/app` - Next.js pages and API routes
- `/src/components` - React components
- `/src/lib` - Utilities and helpers
- `/supabase/migrations` - Database migrations
- `/docs` - Documentation

## Getting Help

- Check existing [documentation](docs/)
- Search [existing issues](https://github.com/Roni2912/pulsemon/issues)
- Ask questions in [discussions](https://github.com/Roni2912/pulsemon/discussions)

## Code of Conduct

Be respectful and inclusive. We're all here to learn and build together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PulseMon! 🚀
