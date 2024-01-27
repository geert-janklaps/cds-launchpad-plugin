const fs = require('fs');
const assert = require('assert');
const puppeteer = require('puppeteer');

async function fetchAndCompare(url, localFile, comparisonName) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error while fetching ${comparisonName}! Status: ${response.status}`);
    }
    const jsonData = await response.json();

    const localData = await fs.promises.readFile(localFile, 'utf8');
    const localJsonData = JSON.parse(localData);

    assert.deepStrictEqual(jsonData, localJsonData);
    console.log(`Success: The response from ${url} and the local file ${localFile} are the same for ${comparisonName}`);
    return true;
  } catch (error) {
    console.error(`Error in ${comparisonName}:`, error.message);
    return false;
  }
}

async function fetchAndCheckButtonWithPuppeteer(url, buttonId, checkName) {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" }); // Addressing the deprecation warning
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Wait for 5 seconds to allow JS execution
    // await page.waitForTimeout(1000);

    // Escape the buttonId for CSS selector
    const escapedButtonId = buttonId.replace(/:/g, '\\:');
    const buttonExists = await page.$(`#${escapedButtonId}`) !== null;

    assert.strictEqual(buttonExists, true);
    console.log(`Success: Button with ID '${buttonId}' exists in ${url} for ${checkName}`);
    return true;
  } catch (error) {
    console.error(`Error in ${checkName}:`, error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}


(async () => {
  let success = true;

  success = await fetchAndCompare(
    'http://localhost:4004/appconfig/fioriSandboxConfig.json',
    './fioriSandboxConfig-sapux.json',
    'sapux Comparison'
  ) && success;

  success = await fetchAndCompare(
    'http://localhost:4005/appconfig/fioriSandboxConfig.json',
    './fioriSandboxConfig-cdspluginui5.json',
    'cds-plugin-ui5 Comparison'
  ) && success;

  success = await fetchAndCompare(
    'http://localhost:4006/appconfig/fioriSandboxConfig.json',
    './fioriSandboxConfig-cdspluginui5deps.json',
    'cds-plugin-ui5-deps Comparison'
  ) && success;

  // Create an array of button check promises
  const buttonCheckPromises = [
    fetchAndCheckButtonWithPuppeteer(
      'http://localhost:4004/$launchpad#semanticObject-action',
      'listofbooks::ListOfBooksList--fe::FilterBar::ListOfBooks-btnSearch',
      'Button Check for sapux'
    ),
    fetchAndCheckButtonWithPuppeteer(
      'http://localhost:4005/$launchpad#semanticObject-action',
      'uimodule::ListOfBooksList--fe::FilterBar::ListOfBooks-btnSearch',
      'Button Check for cds-plugin-ui5'
    ),
    fetchAndCheckButtonWithPuppeteer(
      'http://localhost:4006/$launchpad#semanticObject-action',
      'uimodule::ListOfBooksList--fe::FilterBar::ListOfBooks-btnSearch',
      'Button Check for cds-plugin-ui5-deps'
    )
  ];

  // Execute button checks in parallel and wait for all to complete
  const buttonCheckResults = await Promise.all(buttonCheckPromises.map(p => p.catch(e => e)));

  // Check if any of the button checks failed
  if (buttonCheckResults.some(result => result instanceof Error)) {
    success = false;
  }

  if (!success) {
    throw new Error("One or more comparisons failed.");
  }
})();
