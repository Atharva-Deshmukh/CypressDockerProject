Install Cypress locally, write basic API Test and run them locally first to see if they work.

Now, create a dockerfile to run these tests in a docker container

Here, Image Choice is important, for cypress, there are 3 available images:

DECISION of image

| Image              | Suitable for project?    | Why                                              |
|--------------------|--------------------------|--------------------------------------------------|
| cypress/included   | ✅ YES (Recommended)     | Zero setup, Cypress + Node + browsers included   |
| cypress/browsers   | ⚠️ Maybe later           | Requires installing Cypress yourself             |
| cypress/base       | ❌ No                    | Requires installing Cypress + browsers           |
| cypress/factory    | ❌ No (advanced)         | Used to build custom images                      |
