import { createApi } from "@reduxjs/toolkit/query/react";
import customFetchBaseQuery from "../customFetchBaseQuery";

export const avatarApi = createApi({
  reducerPath: "avatarApi",
  baseQuery: customFetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL,
  }),
  tagTypes: ["Avatar"],
  endpoints: (builder) => ({
    getStudentAvatar: builder.mutation({
      query: (data) => ({
        url: "/avatar/my-avatar",
        method: "POST",
        body: data,
      }),
      providesTags: ["Avatar"],
    }),
    updateAvatar: builder.mutation({
      query: (data) => ({
        url: "/avatar/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Avatar"],
    }),
    getAvatarShop: builder.query({
      query: () => "/avatar/shop",
      providesTags: ["Avatar"],
    }),
    purchaseAvatarItem: builder.mutation({
      query: (data) => ({
        url: "/avatar/purchase",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Avatar"],
    }),
    getAvatarPreview: builder.query({
      query: (params) => ({
        url: "/avatar/preview",
        method: "GET",
        params,
      }),
    }),
  }),
});

export const {
  useGetStudentAvatarMutation,
  useUpdateAvatarMutation,
  useGetAvatarShopQuery,
  usePurchaseAvatarItemMutation,
  useGetAvatarPreviewQuery,
} = avatarApi;
