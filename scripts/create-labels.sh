#!/bin/bash

# Create GitHub Labels for the project
# Run this before creating issues

set -e

echo "Creating labels..."

# Epic labels
gh label create "epic" --color "3E4B9E" --description "Large feature or initiative" --force
gh label create "feature" --color "0E8A16" --description "New feature or enhancement" --force

# Category labels
gh label create "infrastructure" --color "D4C5F9" --description "Build, CI/CD, tooling" --force
gh label create "authentication" --color "FBCA04" --description "OAuth and auth related" --force
gh label create "google-classroom" --color "4285F4" --description "Google Classroom API" --force
gh label create "frontline" --color "F9A825" --description "Frontline TEAMS integration" --force
gh label create "oneroster" --color "FF6F00" --description "OneRoster format/API" --force
gh label create "sync" --color "7057FF" --description "Data synchronization" --force
gh label create "ui" --color "1D76DB" --description "User interface" --force
gh label create "api" --color "B60205" --description "API related" --force

# Type labels
gh label create "setup" --color "C2E0C6" --description "Initial setup tasks" --force
gh label create "design" --color "D876E3" --description "Design and architecture" --force
gh label create "research" --color "F9D0C4" --description "Research and investigation" --force
gh label create "testing" --color "BFD4F2" --description "Tests and QA" --force
gh label create "documentation" --color "0075CA" --description "Documentation" --force
gh label create "security" --color "D93F0B" --description "Security related" --force

# Component labels
gh label create "dashboard" --color "5319E7" --description "Dashboard component" --force
gh label create "courses" --color "006B75" --description "Courses/classes feature" --force
gh label create "students" --color "1D7A8C" --description "Students feature" --force
gh label create "settings" --color "BFDADC" --description "Settings and config" --force
gh label create "import" --color "FEF2C0" --description "Data import feature" --force

# Quality labels
gh label create "typescript" --color "3178C6" --description "TypeScript related" --force
gh label create "dx" --color "E99695" --description "Developer experience" --force
gh label create "ci-cd" --color "0052CC" --description "CI/CD pipeline" --force
gh label create "performance" --color "EDEDED" --description "Performance optimization" --force
gh label create "a11y" --color "D4C5F9" --description "Accessibility" --force
gh label create "responsive" --color "C5DEF5" --description "Responsive design" --force
gh label create "ux" --color "D4C5F9" --description "User experience" --force
gh label create "e2e" --color "BFD4F2" --description "End-to-end testing" --force
gh label create "component" --color "1D76DB" --description "Reusable component" --force
gh label create "data" --color "FBCA04" --description "Data handling" --force
gh label create "types" --color "3178C6" --description "TypeScript types" --force
gh label create "algorithm" --color "5319E7" --description "Algorithm/logic" --force
gh label create "audit" --color "D93F0B" --description "Audit and logging" --force
gh label create "error-handling" --color "B60205" --description "Error handling" --force
gh label create "validation" --color "FBCA04" --description "Input validation" --force
gh label create "compliance" --color "D93F0B" --description "Regulatory compliance" --force
gh label create "user" --color "1D76DB" --description "User-facing docs" --force
gh label create "admin" --color "5319E7" --description "Admin documentation" --force
gh label create "developer" --color "0E8A16" --description "Developer docs" --force
gh label create "architecture" --color "7057FF" --description "Architecture docs" --force
gh label create "auth" --color "FBCA04" --description "Authentication" --force

echo ""
echo "✓ Labels created successfully!"
