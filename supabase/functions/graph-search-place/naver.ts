import { SearchRequest } from "./types.ts";

export const NAVER_API_URL = "https://pcmap-api.place.naver.com/graphql";

export function createNaverRequestBody(params: SearchRequest) {
  const { query, start = 1, display = 100 } = params;
  return [
    {
      operationName: "getRestaurants",
      variables: {
        restaurantListInput: {
          query: query,
          start: start,
          display: display,
          deviceType: "pcmap"
        }
      },
      query: "query getRestaurants($restaurantListInput: RestaurantListInput) {\n  restaurants: restaurantList(input: $restaurantListInput) {\n    items {\n      ...CommonBusinessItems\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment CommonBusinessItems on BusinessSummary {\n  id\n  name\n  category\n  businessCategory\n  commonAddress\n  address\n  __typename\n}"
    }
  ];
}

export async function fetchFromNaver(params: SearchRequest) {
  const requestBody = createNaverRequestBody(params);
  
  return await fetch(NAVER_API_URL, {
    method: "POST",
    headers: {
      accept: "*/*",
      "accept-language": "ko",
      "content-type": "application/json",
      origin: "https://pcmap.place.naver.com",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    },
    body: JSON.stringify(requestBody)
  });
}
