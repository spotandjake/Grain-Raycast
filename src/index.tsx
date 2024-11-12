import { ActionPanel, List, OpenInBrowserAction, showToast, ToastStyle } from "@raycast/api";
import { useEffect, useState } from "react";
import { algoliasearch, type SearchResponse } from "algoliasearch";
import fetch from "node-fetch";

interface DocumentationItem {
  title: string;
  subTitle: string;
  url: string;
  filePath: string;
}
type Result<T> = { isErr: true; err: string } | { isErr: false; data: T };

const buildDetail = async (sourceURL: string, title: string) => {
  const docContent = await fetch(sourceURL);
  const rawMarkdown = await docContent.text();
  // TODO: Parse Content
  // TODO: Build List Item
};
export default function main() {
  // Algolia Preferences
  const algoliaConfig = {
    appId: "CDP8WGS04L",
    apiKey: "fb27c36015ee3fd18739deeb1be5f71b",
    indexName: "grain-lang",
  };
  // Algolia Client
  const algoliaClient = algoliasearch(algoliaConfig.appId, algoliaConfig.apiKey);
  // Search
  const [searchResults, setSearchResults] = useState<DocumentationItem[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const search = async (query: string) => {
    setIsLoading(true);
    const searchResponse = await algoliaClient
      .searchSingleIndex({
        indexName: algoliaConfig.indexName,
        searchParams: { query: query },
      })
      .then((r): Result<SearchResponse<unknown>> => ({ isErr: false, data: r }))
      .catch((err): Result<SearchResponse<unknown>> => ({ isErr: true, err: `${err.message}` }));
    setIsLoading(false);
    if (searchResponse.isErr) {
      showToast(ToastStyle.Failure, "Algolia Error", searchResponse.err);
      return [];
    }
    // Build Query Responses
    const resultItems = [];
    for (const result of searchResponse.data.hits) {
      //eslint-disable-next-line
      const unknownResult = result as any;
      if (unknownResult.type == "lvl2") continue;
      const resultPath = Object.values(unknownResult.hierarchy)
        .filter((n) => n != null)
        .join(" > ");
      console.log(result);
      // Try Build Detail
      const docRawPath =
        unknownResult.url
          .replace(
            "https://grain-lang.org/docs/stdlib/",
            "https://raw.githubusercontent.com/grain-lang/grain/refs/heads/main/stdlib/"
          )
          .replace(/#.*$/, "") + ".md";
      resultItems.push({
        title: unknownResult.hierarchy[unknownResult.type],
        subTitle: resultPath,
        url: unknownResult.url,
        filePath: docRawPath,
      });
    }
    // Return
    return resultItems;
  };
  useEffect(() => {
    (async () => setSearchResults(await search("")))();
  }, []);
  // Display List
  const searchItems = searchResults?.map((result) => {
    // Build List Item
    return (
      <List.Item
        // TODO: What is a good key here?
        key={result.url}
        title={result.title}
        subtitle={result.subTitle}
        actions={
          <ActionPanel title={result.url}>
            <OpenInBrowserAction url={result.url} title="Open in Browser" />
          </ActionPanel>
        }
      />
    );
  });
  return (
    <List
      throttle={true}
      isLoading={isLoading || searchResults === undefined}
      onSearchTextChange={async (q: string) => setSearchResults(await search(q))}
    >
      {searchItems}
    </List>
  );
}
