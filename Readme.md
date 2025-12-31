# Cypress API Tests in Docker

This project demonstrates how to:
- Install Cypress locally
- Write a basic API test
- Run tests locally
- Run the same tests inside a Docker container
- Remove local Cypress and rely entirely on Docker

---

## 1. Local Setup and Test Validation

Before using Docker, it is important to verify that your Cypress tests work locally.

### Steps
1. Install Cypress locally
2. Write a basic API test
3. Run the test locally to ensure it passes

### Important
To run `npm ci` inside a Docker container, a `package-lock.json` file **must exist**.

### Generate `package-lock.json`
```powershell
npm install
```

Now, create a dockerfile to run these tests in a docker container

Here, Image Choice is important, for cypress, there are 3 available images:

DECISION of image

| Image              | Suitable for project?    | Why                                              |
|--------------------|--------------------------|--------------------------------------------------|
| cypress/included   | ✅ YES (Recommended)     | Zero setup, Cypress + Node + browsers included   |
| cypress/browsers   | ⚠️ Maybe later           | Requires installing Cypress yourself             |
| cypress/base       | ❌ No                    | Requires installing Cypress + browsers           |
| cypress/factory    | ❌ No (advanced)         | Used to build custom images                      |


```
Docker File

FROM cypress/included:15.8.1

WORKDIR /myApp

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

```

Folder structure inside container:

```
/myApp
├── cypress/
│   └── e2e/
│       └── api.cy.ts
├── node_modules/
│   ├── cypress/          # Cypress binary already present in image
│   ├── typescript/
│   └── ...
├── Dockerfile            # copied but not used inside container
├── package.json
├── package-lock.json
├── tsconfig.json
└── cypress.config.ts     # (if/when you add it)

```

After Creating dockerfile, we may delete the cypress we installed in our local machine
Command: 
```
powershell
yarn remove cypress
```

Verify removal: 

```
powershell
yarn cypress --version
```

Now, Build an image from our app. Image tag used: cypress-docker

```
powershell
docker build -t cypress-docker .
```

Run a container from this image and that container should be removed after the run:

```
powershell
docker run -rm cypress-docker
```

And the tests are now run inside container with cypress installed, we don't have cypress setup locally.
