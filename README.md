# Sitemap to CSV Utility

This project provides a command-line utility to fetch and parse XML sitemaps (including sitemap indexes) and generate a CSV file containing all unique URLs found.

## Prerequisites

*   [Bun](https://bun.sh) (v1.2.10 or later recommended)

## Installation

1.  Clone the repository (if you haven't already).
2.  Install dependencies:

    ```bash
    bun install
    ```

## Usage

The script `sitemap-to-csv.ts` can be run using the shorthand command defined in `package.json`.

To generate a CSV file named `sitemap_urls.csv` with URLs from one or more sitemaps:

```bash
bun sitemap-to-csv <sitemap_url1> [sitemap_url2] ...
```

**Example:**

```bash
bun sitemap-to-csv https://www.example.com/sitemap_index.xml
```

Or for multiple sitemaps:

```bash
bun sitemap-to-csv https://www.example.com/sitemap1.xml https://www.another.com/sitemap.xml
```

The script will:
*   Fetch the sitemap(s) from the provided URL(s).
*   Recursively process sitemap indexes if encountered.
*   Extract all unique page URLs.
*   Create a `sitemap_urls.csv` file in the project's root directory, with a single column named "URL" listing all found URLs.

## Script Details

The core logic is in `sitemap-to-csv.ts`. It uses the `fast-xml-parser` library to parse XML sitemap data.

This project was initially created using `bun init`.
