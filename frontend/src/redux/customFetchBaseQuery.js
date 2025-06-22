import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import Cookies from "universal-cookie";

const customFetchBaseQuery = ({ baseUrl }) => {
  const cookies = new Cookies();
  let token = localStorage.getItem("token");
  return fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Add the token to the request headers
      const authToken = token; // Read token from cookies
      if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`);
      } 
      // else {
      //   window.location.href = "/login";
      // }
      return headers;
    },
  });
  
};

export default customFetchBaseQuery;
