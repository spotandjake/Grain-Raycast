import { ActionPanel, List, OpenInBrowserAction, showToast, ToastStyle } from "@raycast/api";
import { useEffect, useState } from "react";
import algoliasearch from "algoliasearch/lite";

export default function main() {
  // Algolia Preferences
  const algoliaConfig = {
    appId: "CDP8WGS04L",
    apiKey: "fb27c36015ee3fd18739deeb1be5f71b",
    indexName: "grain-lang",
  };
  // Algolia Client
  const algoliaClient = algoliasearch(algoliaConfig.appId, algoliaConfig.apiKey);
  const algoliaIndex = algoliaClient.initIndex(algoliaConfig.indexName);

  // Search
  const [searchResults, setSearchResults] = useState<any[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const search = async (query = "") => {
    setIsLoading(true);
    return await algoliaIndex
      .search(query)
      .then((res) => {
        setIsLoading(false);
        return res.hits;
      })
      .catch((err) => {
        setIsLoading(false);
        showToast(ToastStyle.Failure, "Algolia Error", err.message);
        return [];
      });
  };
  useEffect(() => {
    (async () => setSearchResults(await search()))();
  }, []);
  // Display List
  const searchItems = searchResults?.map((result) => {
    console.log(result);
    // Get Result Information
    const resultPath = Object.values(result.hierarchy).filter((v) => v !== null);
    const targetLevel = result.type;
    const title = result.hierarchy[targetLevel];
    const subtitle = [];
    for (const pathItem of resultPath) {
      subtitle.push(pathItem);
    }
    // Build List Item Detail
    // const listDetail = (
    //   <List.Item.Detail markdown="![Illustration](https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png)" />
    // );
    // Build List Item
    return (
      <List.Item
        key={result.objectID}
        title={title}
        subtitle={subtitle.join(" > ")}
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
