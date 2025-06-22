import { createApi } from "@reduxjs/toolkit/query/react";
import customFetchBaseQuery from "../customFetchBaseQuery";

// const { Base_URL, getReports } = API;

export const studentsApi = createApi({
  reducerPath: "studentApi",
  baseQuery: customFetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL,
  }),
  tagTypes: ["GetStudent"],
  endpoints: (builder) => ({
    getStudentDetails: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student/get_student_details`,
          method: "POST",
          body,
        };
      },
    }),
    updateStudentPoint: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student/update_student_points`,
          method: "POST",
          body,
        };
      },
    }),
    getStudentAchievements: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student/get_student_achievements`,
          method: "POST",
          body,
        };
      },
    }),
    getIndividualLeaderBoard: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student/get_inidividual_leaderboard`,
          method: "POST",
          body,
        };
      },
    }),
  }),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat({
      async afterResult(result, { dispatch, getState }) {
        if (result.error && result.error.status === 401) {
          // Handle 401 Unauthorized error
          // For example, dispatch a logout action
          // Or redirect user to login page
          // You can access your Redux store here using `dispatch` and `getState`
          // dispatch(logoutAction());
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return result;
      },
    }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints\
export const {
  useGetIndividualLeaderBoardMutation,
  useGetStudentAchievementsMutation,
  useGetStudentDetailsMutation,
  useUpdateStudentPointMutation,
} = studentsApi;
