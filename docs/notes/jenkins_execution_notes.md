1. Initially once we install jenkins
2. need to install nodejs in it and in tools we need to map with latest version
3. In the project configure, we need to use Execute Windows batch command under "Build Steps"
    initially we need to give "cmd" to check the directory location
    Later we need to give the command as below which is equivalent for windows,
    set CI=true
    set STANDARD_USER=standard_user
    set TTA_SECRET=tta_secret
    call npm ci --audit=false
    call npx playwright install chromium
    call npx playwright test src/tests/login.spec.ts src/tests/e2e-checkout.spec.ts --project=chromium
4. In the above step, it will download the dependencies and run those two tests.
5. Finally we get the report and the css alone we need to correct for that we need to provide
    System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "sandbox allow-scripts allow-same-origin; default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data;;")
6. Now on build, the report is displaying with correct css.