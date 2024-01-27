const fs = require('fs');
const assert = require('assert');

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

(async () => {
  let success = true;

  success = await fetchAndCompare(
    'http://localhost:4004/appconfig/fioriSandboxConfig.json',
    './fioriSandboxConfig-sapux.json',
    'SAP UX Comparison'
  ) && success;

  success = await fetchAndCompare(
    'http://localhost:4005/appconfig/fioriSandboxConfig.json',
    './fioriSandboxConfig-cdspluginui5.json',
    'CDS Plugin UI5 Comparison'
  ) && success;

  success = await fetchAndCompare(
    'http://localhost:4006/appconfig/fioriSandboxConfig.json',
    './fioriSandboxConfig-cdspluginui5deps.json',
    'cds-plugin-ui5-deps Comparison'
  ) && success;

  if (!success) {
    throw new Error("One or more comparisons failed.");
  }
})();
