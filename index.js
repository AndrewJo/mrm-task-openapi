const { file, packageJson, yaml } = require("mrm-core");
const fetch = require("node-fetch");
const parseAuthor = require("parse-author");
const meta = require("user-meta");
const { parseDocument } = require("yaml");

function inferContact(package) {
  return typeof package.get("author") === "object"
    ? package.get("author")
    : typeof package.get("author") === "string"
    ? parseAuthor(package.get("author"))
    : meta;
}

function parseVersion(version) {
  const [major, minor, patch] = version.split(".");
  return {
    major,
    minor,
    patch,
  };
}

/**
 * Compares two version strings.
 * @param {string} version1 - first version string
 * @param {string} version2 - second version string
 * @returns 1 if version1 is higher than version2, -1 if version1 is lower than
 * version2, 0 if identical.
 */
function compareVersion(version1, version2) {
  if (version1 === version2) {
    return 0;
  }

  const parsedVersion1 = parseVersion(version1);
  const parsedVersion2 = parseVersion(version2);
  const major1 = Number(parsedVersion1.major);
  const major2 = Number(parsedVersion2.major);
  const minor1 = Number(parsedVersion1.minor);
  const minor2 = Number(parsedVersion2.minor);
  const patch1 = Number(parsedVersion1.patch);
  const patch2 = Number(parsedVersion2.patch);

  return major1 > major2 ||
    (major1 === major2 &&
      (minor1 > minor2 || (minor1 === minor2 && patch1 > patch2)))
    ? 1
    : -1;
}

async function getSpdxLicenseData(spdxVersion) {
  const response = await fetch(
    `https://raw.githubusercontent.com/spdx/license-list-data/v${spdxVersion}/json/licenses.json`
  );
  const { licenses } = await response.json();
  return licenses;
}

async function findSpdxLicense(spdxIdentifier, spdxVersion) {
  const licenses = await getSpdxLicenseData(spdxVersion);
  return licenses.find(({ licenseId }) => licenseId === spdxIdentifier);
}

async function normalizeLicense(spdxIdentifier, spdxVersion, openapiVersion) {
  const license = await findSpdxLicense(spdxIdentifier, spdxVersion);

  if (license) {
    return compareVersion(openapiVersion, "3.1.0") >= 0
      ? {
          // OpenAPI Spec 3.1 or above
          // The url field is mutually exclusive of the identifier field in
          // License Object
          name: license.name,
          identifier: license.licenseId,
        }
      : {
          // OpenAPI Spec 3.0 or below uses url field
          name: license.name,
          url: license.reference,
        };
  }

  return undefined;
}

function quote(str) {
  return `"${str}"`;
}

async function task({
  openapiFile,
  openapiVersion,
  title,
  description,
  version,
  license,
  contact,
  override,
  spdxLicenseDataVersion,
}) {
  const openapi = yaml(openapiFile, { openapi: openapiVersion, paths: {} });
  const existingOpenAPIVersion = openapi.get("openapi");
  const licenseObject = await normalizeLicense(
    license,
    spdxLicenseDataVersion,
    existingOpenAPIVersion
  );
  const existingTitle = openapi.get("info.title", title);
  const existingDescription = openapi.get("info.description", description);
  const existingVersion = openapi.get("info.version", version);
  const existingLicense = openapi.get("info.license", licenseObject);
  const existingContact = openapi.get("info.contact", contact);

  const info = {
    title: override.includes("title") ? title : existingTitle,
    description: override.includes("description")
      ? description
      : existingDescription,
    version: override.includes("version") ? version : existingVersion,
    license: override.includes("license") ? licenseObject : existingLicense,
    contact: override.includes("contact") ? contact : existingContact,
  };

  if (openapi.exists()) {
    // Can't use the yaml provided by mrm-core due to a bug that messes up
    // existing file formatting and comments.
    const output = file(openapiFile);
    const yamlDoc = parseDocument(output.get(), { keepSourceTokens: true });
    yamlDoc.set("info", info);
    output.save(yamlDoc.toString());
  } else {
    // If the file didn't already exist, just set the info object and save the
    // file.
    openapi.set("info", info);
    openapi.save();
  }
}

module.exports = task;

module.exports.description =
  "Infers OpenAPI specification values from package.json";

module.exports.parameters = {
  openapiFile: {
    type: "input",
    message: "Enter the OpenAPI filename",
    default: "openapi.yaml",
  },
  openapiVersion: {
    type: "input",
    message: "OpenAPI specification version",
    default: "3.1.0",
  },
  title: {
    type: "input",
    message: "Title of the API",
    default() {
      return packageJson().get("name");
    },
  },
  description: {
    type: "input",
    message: "Description of the API",
    default() {
      return packageJson().get("description");
    },
  },
  version: {
    type: "input",
    message: "Version",
    default() {
      return packageJson().get("version");
    },
  },
  license: {
    type: "input",
    message:
      "License identifer in SPDX format, NONE, UNLICENSED, or URL to a custom license",
    default() {
      return packageJson().get("license");
    },
  },
  contact: {
    type: "input",
    message: "Point of contact for the API",
    default() {
      return inferContact(packageJson());
    },
  },
  override: {
    type: "checkbox",
    message: "Select the field names you wish to override",
    choices: [
      { value: "title" },
      { value: "description" },
      { value: "version", checked: true },
      { value: "license", checked: true },
      { value: "contact" },
    ],
    default: ["version", "license"],
  },
  spdxLicenseDataVersion: {
    type: "input",
    message: "Specify the SPDX license data version (3.17)",
    default: "3.17",
  },
};
