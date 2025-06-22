import { createApi } from "@reduxjs/toolkit/query/react";
import customFetchBaseQuery from "../customFetchBaseQuery";

// const { Base_URL, getReports } = API;

export const createUserApi = createApi({
  reducerPath: "createUserApi",
  baseQuery: customFetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL,
  }),
  tagTypes: ["GetReportList"],
  endpoints: (builder) => ({
    createUser: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/auth/register`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["CreateUser"],
    }),
    login: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/auth/login`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Login"],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints\
export const { useCreateUserMutation, useLoginMutation } = createUserApi;
