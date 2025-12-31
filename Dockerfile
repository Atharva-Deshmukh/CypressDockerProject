# Use Cypress Included image matching your Cypress version
FROM cypress/included:15.8.1

# Set working directory
WORKDIR /myApp

# Copy only package files first (Docker cache optimization)
# Dependency resolution uses package-lock.json
# yarn.lock is ignored
# No conflict occurs
# Docker does not auto-run Yarn just because yarn.lock exists.

COPY package.json package-lock.json ./

# Install dependencies (Cypress already exists, this installs TypeScript, etc.)
RUN npm ci

# Copy the rest of the project
COPY . .

# IMPORTANT:
# The image automatically runs cypress run when the container starts, 
# so you don't need to specify a CMD or ENTRYPOINT.
# cypress/included already runs: cypress run
