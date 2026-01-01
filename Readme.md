# This Small Project Covers Running Cypress Test Scripts on:

1. A docker container locally (without cypress installed on the host machine)
2. CI/CD (Github Actions):
- Without Docker, directly on the github runners inside an ubuntu machine
- With docker, docker container inside github runners 

---

## Running Cypress API Tests in Docker container in host machine

### 1. Local Setup and Test Validation

Before using Docker, it is important to verify that your Cypress tests work locally.

#### Steps
1. Install Cypress locally
2. Write a basic API test
3. Run the test locally to ensure it passes

#### Important
To run `npm ci` inside a Docker container, a `package-lock.json` file **must exist**.

#### Generate `package-lock.json`

powershell
```
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


Docker File
```

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

powershell
```
yarn remove cypress
```

Verify removal:

powershell 
```
yarn cypress --version
```

Now, Build an image from our app. Image tag used: cypress-docker

powershell
```
docker build -t cypress-docker .
```

Run a container from this image and that container should be removed after the run:

powershell
```
docker run -rm cypress-docker
```

And the tests are now run inside container with cypress installed, we don't have cypress setup locally.

## SOME IMPORTANT POINTS:

### 1. npm install vs npm ci

package.json defines allowed versions, but package-lock.json defines installed versions — and npm ci trusts only the lockfile.

#### npm install

npm install installs dependencies based on package.json and may use package-lock.json.
If version ranges allow it, npm can resolve newer compatible versions and update the lockfile.

- Updates package-lock.json
- Slower compared to npm ci
- Suitable for local development, not ideal for CI

#### What happens with npm install

1. npm reads package.json
2. Sees ^18.3.1
3. Resolves the latest compatible version (say 18.3.4)
4. Updates package-lock.json and Installs that version
5. If a new compatible version is released later, the next npm install may pull:

```
18.3.5 → different dependency tree → possible test break
```
This is where flakiness comes from.

#### Risks while testing:

Two CI runs can install slightly different dependency trees → tests pass in one run and fail in another.

#### npm ci

npm ci is designed for continuous integration. It installs dependencies exactly as specified in package-lock.json, ensuring reproducible and deterministic builds.

- Deletes node_modules before installing
- Fails if package.json and package-lock.json are out of sync
- Does not modify the lockfile
- Faster and more reliable
- Guarantees consistent test environments

#### What happens with npm ci

- npm ignores version ranges in package.json
- Reads exact versions from package-lock.json and Installs exactly those versions
- Fails if package-lock.json doesn’t match package.json

Example lockfile entry:
```
"react": {
  "version": "18.3.2",
  "resolved": "...",
  "integrity": "..."
}
```

npm ci will always install 18.3.2, even if 18.3.5 exists and package.json allows it (^18.3.1)

### 2. Entrypoint vs CMD

#### High-level difference

- ENTRYPOINT defines what the container is,
- CMD defines what the container does by default.


#### CMD


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

#### Risk in CI

Someone can override CMD and accidentally skip tests.

#### ENTRYPOINT

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

---

# Little Theory --> Components of Github actions

### Workflow 👉 The whole plan

- A workflow is a set of steps that run automatically.
- It is written in a YAML file and stored in .github/workflows/.
- Think of it as a recipe.

### Event 👉 The trigger

- An event tells GitHub when to run the workflow.
- Pushing code (push), Creating a pull request (pull_request), Clicking a button manually (workflow_dispatch)

### Job 👉 A big task

A workflow contains one or more jobs. Each job does something important, 
like:
- Run tests
- Build the app
- Deploy the app
Jobs usually run in parallel.
Think of a job as a worker doing a task.

### Runner 👉 The machine that does the work

- A runner is the computer that runs the job.
- GitHub provides runners like: Ubuntu, Windows, macOS

Think of it as the computer that follows the instructions.

### Step 👉 Small actions inside a job

- A job is made of steps.

- Each step does one small thing:
1. Checkout code
2. Install dependencies
3. Run a command

Think of steps as instructions in the recipe.

### YAML File 👉 Where everything is written

- Workflows are written in YAML.
- It describes: When to run, What jobs to run, What steps to follow


Simple Mental Picture
```
Event happens
   ↓
Workflow starts
   ↓
Jobs run
   ↓
Steps execute
   ↓
Actions help
   ↓
Runner does the work
```
---

## Running Cypress API Tests in Github Actions (Without Docker)

We will create a yaml file first in the location ROOT -> .github/workflows/file.yml:

Refer this in Repo
```
.github\workflows\withoutDocker.yml
```

Refer these Screenshots
```
YAML SCREENSHOTS
```
In yaml file, we can see prewritten actions like actions/checkout@v4

I have created 3 jobs:
- build job that creates node modules
- two parallely executing jobs that runs int-1 and int-2 specs separately

Each GitHub Actions job runs on a fresh, separate VM.

That means:
- build-job runs on Machine A
- api-int-1 runs on Machine B
- api-int-2 runs on Machine C

Nothing (files, node_modules, caches) is shared automatically between them.
I used cache to share node_modules between jobs

GitHub cache works like this:
```

Cache Storage (GitHub)
       ↑     ↓
build-job  api-int-1  api-int-2

GitHub caches are stored on GitHub’s infrastructure, not inside your repo and not permanently on the runner.
```

## In each job I created, this happens:

```
VM starts empty
npm cache is restored (if available)
npm ci creates a new node_modules folder
Tests/build run
VM is destroyed

node_modules is built separately in each job.
```

```
## What Is Reused vs Rebuilt

| Thing                 | Reused? | How                          |
|-----------------------|---------|------------------------------|
| npm package downloads | ✅ Yes  | GitHub cache (`~/.npm`)      |
| Cypress binary        | ✅ Yes  | npm cache                    |
| node_modules folder   | ❌ No   | Rebuilt every job            |
| Compiled JS / TS      | ❌ No   | Job-local                    |
| OS filesystem         | ❌ No   | New VM                       |

```

Even though node_modules is rebuilt, npm does not download packages again

It just:

- Copies from cache
- Extracts tarballs
- Links binaries

That’s why cached installs are usually seconds, not minutes.

## What I avoided

❌ Share node_modules via artifacts
❌ Skip npm ci in test jobs
❌ Assume jobs share filesystems

Those approaches cause:

- Flaky builds
- OS / path issues
- Cypress binary mismatches

## My Subsequent Runs workflow

Subsequent runs / parallel jobs (warm cache)

In every job Cache is restored (~/.npm)

npm ci:

- Does NOT download packages
- Does NOT download Cypress again
- Extracts packages from cache
- Recreates node_modules
- Links binaries (node_modules/.bin)

➡️ No network downloads
➡️ Only filesystem work

---

# Secrets management

Instead of hardcoding base URLs, passwords, we store those variables in github secrets and then
access them from there.
This makes tests run of different environments with different credentials

Here, I have just added base URL, which was hardcoded earlier in github secrets.

## Where to Add Github Secrets?

GitHub Repo → Settings Tab → Secrets → Actions -> Variables -> Create new env variable there.
This separates environment concerns

```
Secrets --> They are encrypted and not shown like password, client secret
Variables --> They are shown since they are non-sensitive like base URL
```

I added:
```
API_BASE_URL = https://jsonplaceholder.typicode.com
```

Changes made in yaml file to map this env variable

```
      # Install dependencies (fast due to cache)
      - name: Install dependencies
        run: npm ci

      # Run Cypress tests for api-int-secretPassed - Secret is passed in env, we just map here
      - name: Run Cypress tests (api-int-secretPassed)
        run: npx cypress run --spec "cypress/e2e/api-int-secretPassed/*.cy.{js,ts}"
        env:
          CYPRESS_API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

npx cypress run works in CI without prefixing the variable, so this works

```
        run: npx cypress run --spec "cypress/e2e/api-int-secretPassed/*.cy.{js,ts}"
        env:
          CYPRESS_API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

Locally you do this:
```
CYPRESS_API_BASE_URL=https://jsonplaceholder.typicode.com npx cypress run
```

Because you must inject the environment variable yourself in your local shell.

## NOTE:

when we have more than one yml file, each of which represent a separate workflow, each yml file 
is triggered if it meets condition in 'On' and 'Branches'



