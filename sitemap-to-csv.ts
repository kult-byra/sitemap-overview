#!/usr/bin/env bun
// sitemap-to-csv.ts

import { XMLParser } from "fast-xml-parser";

interface SitemapEntry {
	loc: string;
	// other fields like lastmod might exist but are not used here
}

interface SitemapIndex {
	sitemapindex?: {
		sitemap: SitemapEntry | SitemapEntry[];
	};
}

interface UrlSet {
	urlset?: {
		url: SitemapEntry | SitemapEntry[];
	};
}

type SitemapXML = SitemapIndex | UrlSet;

const fetchSitemapContent = async (url: string): Promise<string> => {
	console.log(`Fetching sitemap: ${url}`);
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch sitemap from ${url}: ${response.status} ${response.statusText}`,
		);
	}
	return response.text();
};

const parser = new XMLParser({
	ignoreAttributes: false, // Keep attributes if needed, though sitemap standard uses <loc> elements
	allowBooleanAttributes: true,
});

const processSitemap = async (
	sitemapUrl: string,
	visitedSitemaps: Set<string>,
	allPageUrls: Set<string>,
): Promise<void> => {
	if (visitedSitemaps.has(sitemapUrl)) {
		console.log(`Sitemap already visited: ${sitemapUrl}`);
		return;
	}
	visitedSitemaps.add(sitemapUrl);

	try {
		const xmlText = await fetchSitemapContent(sitemapUrl);
		const sitemap: SitemapXML = parser.parse(xmlText);

		// Type guard to check if it's a sitemap index
		if ("sitemapindex" in sitemap && sitemap.sitemapindex?.sitemap) {
			console.log(`Processing sitemap index: ${sitemapUrl}`);
			const sitemapEntries = Array.isArray(sitemap.sitemapindex.sitemap)
				? sitemap.sitemapindex.sitemap
				: [sitemap.sitemapindex.sitemap];

			for (const entry of sitemapEntries) {
				if (entry?.loc) {
					// Recursively process the sitemap URL found in the index
					await processSitemap(entry.loc, visitedSitemaps, allPageUrls);
				}
			}
		}
		// Type guard to check if it's a URL set
		else if ("urlset" in sitemap && sitemap.urlset?.url) {
			console.log(`Processing URL set: ${sitemapUrl}`);
			const urlEntries = Array.isArray(sitemap.urlset.url)
				? sitemap.urlset.url
				: [sitemap.urlset.url];

			for (const entry of urlEntries) {
				if (entry?.loc) {
					allPageUrls.add(entry.loc);
				}
			}
		} else {
			console.warn(
				`Unknown sitemap format or empty sitemap at ${sitemapUrl}. Content snippet: ${xmlText.substring(0, 200)}`,
			);
		}
	} catch (error) {
		console.error(
			`Error processing sitemap ${sitemapUrl}:`,
			error instanceof Error ? error.message : String(error),
		);
		// Optionally, decide if one error should stop the whole process or just skip the problematic sitemap
	}
};

const main = async () => {
	const args = process.argv.slice(2); // Get command line arguments after script name

	if (args.length === 0) {
		console.error("Please provide at least one sitemap URL.");
		console.log(
			"Usage: bun sitemap-to-csv.ts <sitemap_url1> [sitemap_url2] ...",
		);
		process.exit(1);
	}

	const initialSitemapUrls: string[] = args;
	const allPageUrls = new Set<string>();
	const visitedSitemaps = new Set<string>();

	console.log("Starting sitemap processing...");

	for (const sitemapUrl of initialSitemapUrls) {
		await processSitemap(sitemapUrl, visitedSitemaps, allPageUrls);
	}

	if (allPageUrls.size === 0) {
		console.log("No URLs found in the provided sitemaps.");
		return;
	}

	// Create CSV content (header + one URL per line)
	const csvHeader = "URL";
	const csvRows = Array.from(allPageUrls);
	const csvContent = `${csvHeader}\n${csvRows.join("\n")}`;
	const outputFilename = "sitemap_urls.csv";

	try {
		await Bun.write(outputFilename, csvContent);
		console.log(`
Successfully generated ${outputFilename} with ${allPageUrls.size} unique URLs.`);
	} catch (error) {
		console.error(
			`Failed to write CSV file '${outputFilename}':`,
			error instanceof Error ? error.message : String(error),
		);
	}
};

main().catch((err) => {
	console.error("Unhandled error in main execution:", err);
	process.exit(1);
});
