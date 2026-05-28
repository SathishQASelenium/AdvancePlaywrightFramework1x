git init
npm init playwright@latest
npm i -D @faker-js/faker
npm i -D allure-playwright
npm i -D csv-parse
npm i -D dotenv
npm i -D winston
npm i -D xlsx

playwright.config.ts

https://app.thetestingacademy.com/playwright/advance-framework
4. Build the framework, folder by folder
tsconfig.json -> Initially can be empty. Actually must be filled once we are done with folder creation

src/folder
    -> pages
    -> testdata
    -> tests
    -> utils
    -> fixtures
    -> config
    -> api

Need to create a folder rules, which will run everytime we write a code, these type check and lint check will be run along with a basic program run.
    -> These will be added to CLAUDE.md file as well as AI knows these are part of a check in the project
Note:   These are to be present in .github folder also to be used by copilot also.
        Similarly for cursor rules and others as well.

Created docs/phase1 and copied all the prompts.md content in it.

Copied .augument-guidelines, .cursorrules, .windsurfrules, AGENTS.md [for Antigravity]

Updated .gitignore

.env file

A File for Docker -> Dockerfile

README.md file

ran a sample test and all the test results folder also got included in the framework.

