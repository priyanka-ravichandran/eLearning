import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const base_url = process.env.REACT_APP_BASE_URL;

export const dailyChallengeApi = createApi({
  reducerPath: "dailyChallengeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${base_url}/daily-challenge`,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["DailyChallenge", "Leaderboard"],
  endpoints: (builder) => ({
    // Teacher posts a daily challenge
    postDailyChallenge: builder.mutation({
      query: (challengeData) => ({
        url: "/post",
        method: "POST",
        body: challengeData,
      }),
      invalidatesTags: ["DailyChallenge"],
    }),

    // Get today's challenge
    getTodaysChallenge: builder.query({
      query: () => "/today",
      providesTags: ["DailyChallenge"],
    }),

    // Get active challenge
    getActiveChallenge: builder.query({
      query: () => "/active",
      providesTags: ["DailyChallenge"],
    }),

    // Submit individual answer to daily challenge
    submitIndividualAnswer: builder.mutation({
      query: (submissionData) => ({
        url: "/submit",
        method: "POST",
        body: submissionData,
      }),
      invalidatesTags: ["DailyChallenge", "Leaderboard"],
    }),

    // Get challenge leaderboard
    getChallengeLeaderboard: builder.query({
      query: (challengeId) => `/leaderboard/${challengeId}`,
      providesTags: ["Leaderboard"],
    }),

    // Get challenge by date
    getDailyChallengeByDate: builder.query({
      query: (date) => `/date/${date}`,
      providesTags: ["DailyChallenge"],
    }),

    // Get challenge by ID
    getDailyChallengeById: builder.query({
      query: (challengeId) => `/${challengeId}`,
      providesTags: ["DailyChallenge"],
    }),

    // Get challenge history
    getChallengeHistory: builder.query({
      query: (limit = 10) => `/history?limit=${limit}`,
      providesTags: ["DailyChallenge"],
    }),

    // Get group's submission for a challenge
    getGroupSubmission: builder.query({
      query: ({ challengeId, groupId }) => `/submission/${challengeId}/${groupId}`,
      providesTags: ["DailyChallenge"],
    }),

    // Update challenge status (for admin use)
    updateChallengeStatus: builder.mutation({
      query: (statusData) => ({
        url: "/update-status",
        method: "POST",
        body: statusData,
      }),
      invalidatesTags: ["DailyChallenge"],
    }),
  }),
});

export const {
  usePostDailyChallengeMutation,
  useGetTodaysChallengeQuery,
  useGetActiveChallengeQuery,
  useGetDailyChallengeByDateQuery,
  useGetDailyChallengeByIdQuery,
  useSubmitIndividualAnswerMutation,
  useGetChallengeLeaderboardQuery,
  useGetChallengeHistoryQuery,
  useGetGroupSubmissionQuery,
  useUpdateChallengeStatusMutation,
  // Lazy queries for manual triggering
  useLazyGetTodaysChallengeQuery,
  useLazyGetActiveChallengeQuery,
  useLazyGetDailyChallengeByDateQuery,
  useLazyGetDailyChallengeByIdQuery,
  useLazyGetChallengeLeaderboardQuery,
  useLazyGetChallengeHistoryQuery,
  useLazyGetGroupSubmissionQuery,
} = dailyChallengeApi;
