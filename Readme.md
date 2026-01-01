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

```

#SOME IMPORTANT POINTS:

## 1. npm install vs npm ci

package.json defines allowed versions, but package-lock.json defines installed versions — and npm ci trusts only the lockfile.

### npm install

npm install installs dependencies based on package.json and may use package-lock.json.
If version ranges allow it, npm can resolve newer compatible versions and update the lockfile.

- Updates package-lock.json
- Slower compared to npm ci
- Suitable for local development, not ideal for CI

### What happens with npm install

1. npm reads package.json
2. Sees ^18.3.1
3. Resolves the latest compatible version (say 18.3.4)
4. Updates package-lock.json and Installs that version
5. If a new compatible version is released later, the next npm install may pull:

```
18.3.5 → different dependency tree → possible test break
```
This is where flakiness comes from.

### Risks while testing:

Two CI runs can install slightly different dependency trees → tests pass in one run and fail in another.

### npm ci

npm ci is designed for continuous integration. It installs dependencies exactly as specified in package-lock.json, ensuring reproducible and deterministic builds.

- Deletes node_modules before installing
- Fails if package.json and package-lock.json are out of sync
- Does not modify the lockfile
- Faster and more reliable
- Guarantees consistent test environments

### What happens with npm ci

- npm ignores version ranges in package.json
- Reads exact versions from package-lock.json and Installs exactly those versions
- Fails if package-lock.json doesn’t match package.json

```
Example lockfile entry:

"react": {
  "version": "18.3.2",
  "resolved": "...",
  "integrity": "..."
}
```

npm ci will always install 18.3.2, even if 18.3.5 exists and package.json allows it (^18.3.1)

## 2. Entrypoint vs CMD

### High-level difference

- ENTRYPOINT defines what the container is,
- CMD defines what the container does by default.


### CMD


Provides default arguments or a default command
Can be overridden easily at runtime

```
CMD ["npm", "test"]
```

Runtime override

```
docker run my-image npm run smoke
```

➡️ CMD is replaced.

### Risk in CI

Someone can override CMD and accidentally skip tests.

### ENTRYPOINT

Defines the fixed executable that always runs
Cannot be overridden accidentally (unless explicitly forced)

```
ENTRYPOINT ["npm"]
CMD ["test"]
```

Runtime behavior

```
docker run my-image run smoke
```

➡️ Executes:

```
npm run smoke
```

Prevents accidental bypassing of automation
Safer for CI and production pipelines

``` 