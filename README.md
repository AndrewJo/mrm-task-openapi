# mrm-task-openapi

[Mrm](https://github.com/sapegin/mrm) task that creates and infers [OpenAPI specification](https://spec.openapis.org/oas/latest.html#info-object) with values from `package.json`.

## What it does

* Populates [OpenAPI Info Object](https://spec.openapis.org/oas/latest.html#info-object)
  * Populates `title` string field with `name` field in `package.json`.
  * Populates `description` string field with `description` field in `package.json`.
  * Populates `license` [License Object](https://spec.openapis.org/oas/latest.html#licenseObject) field with `license` field in `package.json`.
    * Only supports [SPDX](https://spdx.org/licenses/) license identifiers.
    * Multiple licenses are not supported in OpenAPI specification which means SPDX multi-license expressions (e.g. `(ISC OR MIT)`) is not supported.
  * Populates `version` string field with `version` field in `package.json`.
  * Populates `contact` [Contact Object](https://spec.openapis.org/oas/latest.html#contactObject) field with `author` field in `package.json`.
    * String shortform (e.g. `"Tim Apple <tim@apple.com> (https://www.apple.com/)"`) will be parsed and expanded into a [Person Object](https://docs.npmjs.com/cli/v6/configuring-npm/package-json#people-fields-author-contributors) before being converted into a [Contact Object](https://spec.openapis.org/oas/latest.html#contactObject).

## Usage

```shell
npx mrm openapi
```

## Options

### `openapiFile` (default: `openapi.yaml`)

Location of the OpenAPI specification file.

### `openapiVersion` (default: taken from `openapi` field in `openapiFile` contents or fallback to `3.1.0`)

OpenAPI specification version. See [all versions](https://github.com/OAI/OpenAPI-Specification/tree/main/versions).

### `title` (default: taken from `name` field in `package.json`)

Title of the API. Does not override existing `title` in the OpenAPI specification file unless the field is deleted or `override` configuration is set.

### `description` (default: taken from `description` field in `package.json`)

A description of the API. Does not override existing `description` in the OpenAPI specification file unless the field is deleted or `override` configuration is set.

### `version` (default: taken from `version` field in `package.json`)

The version of the OpenAPI document. Always overrides `version` in the OpenAPI Info Object unless `override` configuration is set otherwise.

### `license` (default: taken from `license` field in `package.json`)

The license information for the exposed API. Must be in [SPDX](https://spdx.org/licenses/) license identifier format. If set to `NONE` or `UNLICENSED`, this field will ***NOT*** be populated in the specification file. Always overrides `license` License Object unless `override` configuration is set otherwise.

### `contact` (default: taken from `author` field in `package.json` or npm or Git config)

The contact information for the exposed API. Does not override existing `contact` Contact Object in the OpenAPI specification file unless the field is deleted or `override` configuration is set.

### `override` (default: `version,license`)

Comma delimited string of field names to override with value from `package.json` every time this task runs.

### `spdxLicenseDataVersion` (default: `3.17`)

Version string for [SPDX license list database](https://github.com/spdx/license-list-data).

## Changelog

The changelog can be found on the [Releases page](/releases).

## Contributing

Everyone is welcome to contribute. Please take a moment to review the [contributing guidelines](CONTRIBUTING.md).

## Authors and license

[Andrew Jo](https://github.com/AndrewJo/mrm-task-openapi) and [contributors](/graphs/contributors).

MIT License, see the included [LICENSE.md](LICENSE.md) file.
