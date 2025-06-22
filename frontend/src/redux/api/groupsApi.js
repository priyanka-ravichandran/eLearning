import { createApi } from "@reduxjs/toolkit/query/react";
import customFetchBaseQuery from "../customFetchBaseQuery";

// const { Base_URL, getReports } = API;

export const groupsApi = createApi({
  reducerPath: "groupsApi",
  baseQuery: customFetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL,
  }),
  tagTypes: ["GetGroup"],
  endpoints: (builder) => ({
    getGroupDetails: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/group/get_group_details`,
          method: "POST",
          body,
        };
      },
    }),
    updateVillageLevel: builder.mutation({
        query: (body) => {
          console.log("body", body);
          return {
            url: `/group/update_village_level`,
            method: "POST",
            body,
          };
        },
      }),
      updateGroupPoints: builder.mutation({
        query: (body) => {
          console.log("body", body);
          return {
            url: `/group/update_group_points`,
            method: "POST",
            body,
          };
        },
      }),
      getGroupAchievements: builder.mutation({
        query: (body) => {
          console.log("body", body);
          return {
            url: `/group/get_group_achievements`,
            method: "POST",
            body,
          };
        },
      }),
      getGroupLeaderBoard: builder.mutation({
        query: (body) => {
          console.log("body", body);
          return {
            url: `/group/get_group_leaderboard`,
            method: "POST",
            body,
          };
        },
      }),
      createGroup: builder.mutation({
        query: (body) => {
          console.log("body", body);
          return {
            url: `/group/create_group`,
            method: "POST",
            body,
          };
        },
      }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints\
export const { useGetGroupDetailsMutation,useUpdateVillageLevelMutation,useUpdateGroupPointsMutation,useGetGroupAchievementsMutation,
useGetGroupLeaderBoardMutation,useCreateGroupMutation } = groupsApi;
