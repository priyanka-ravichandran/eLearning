import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const base_url = process.env.REACT_APP_BASE_URL;

export const individualDailyQuestionApi = createApi({
  reducerPath: "individualDailyQuestionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${base_url}/individual-question`,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["IndividualQuestion"],
  endpoints: (builder) => ({
    // Get today's individual question
    getTodaysIndividualQuestion: builder.query({
      query: () => "/today",
      providesTags: ["IndividualQuestion"],
    }),

    // Get active individual question
    getActiveIndividualQuestion: builder.query({
      query: () => "/active",
      providesTags: ["IndividualQuestion"],
    }),

    // Submit individual answer
    submitIndividualAnswer: builder.mutation({
      query: (submissionData) => ({
        url: "/submit",
        method: "POST",
        body: submissionData,
      }),
      invalidatesTags: ["IndividualQuestion"],
    }),

    // Get student's answer for today
    getStudentAnswerForToday: builder.query({
      query: (studentId) => `/student/${studentId}/answer`,
      providesTags: ["IndividualQuestion"],
    }),

    // Get individual question by ID
    getIndividualQuestionById: builder.query({
      query: (questionId) => `/${questionId}`,
      providesTags: ["IndividualQuestion"],
    }),

    // Post individual daily question (for admin use)
    postIndividualDailyQuestion: builder.mutation({
      query: (questionData) => ({
        url: "/post",
        method: "POST",
        body: questionData,
      }),
      invalidatesTags: ["IndividualQuestion"],
    }),
  }),
});

export const {
  useGetTodaysIndividualQuestionQuery,
  useGetActiveIndividualQuestionQuery,
  useSubmitIndividualAnswerMutation,
  useGetStudentAnswerForTodayQuery,
  useGetIndividualQuestionByIdQuery,
  usePostIndividualDailyQuestionMutation,
  // Lazy queries for manual triggering
  useLazyGetTodaysIndividualQuestionQuery,
  useLazyGetActiveIndividualQuestionQuery,
  useLazyGetStudentAnswerForTodayQuery,
  useLazyGetIndividualQuestionByIdQuery,
} = individualDailyQuestionApi;
