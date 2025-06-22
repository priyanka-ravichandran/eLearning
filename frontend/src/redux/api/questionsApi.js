import { createApi } from "@reduxjs/toolkit/query/react";
import customFetchBaseQuery from "../customFetchBaseQuery";

// const { Base_URL, getReports } = API;

export const questionsApi = createApi({
  reducerPath: "questionsApi",
  baseQuery: customFetchBaseQuery({
    baseUrl: process.env.REACT_APP_BASE_URL,
  }),
  tagTypes: ["GetReportList", "MyQuestions", "GetQuestionDetail"],
  endpoints: (builder) => ({
    getAllQuestions: builder.query({
      query: (body) => {
        return {
          url: `/student_question/get_student_questions_posted`,
          method: "POST",
          body,
        };
      },
    }),
    getQuestionForWeek: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/get_questions_for_week`,
          method: "POST",
          body,
        };
      },
    }),
    postQuestion: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/post_a_question`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["MyQuestions"],
    }),
    getQuestionDetail: builder.query({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/get_question_details`,
          method: "POST",
          body,
        };
      },
      providesTags: ["GetQuestionDetail"],
    }),
    submitAnswer: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/submit_answer`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["GetQuestionDetail"],
    }),
    getMyQuestions: builder.query({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/get_my_questions`,
          method: "POST",
          body,
        };
      },
      providesTags: ["MyQuestions"],
    }),
    voteStudent: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/vote_student_answer`,
          method: "POST",
          body,
        };
      },
    }),
    reactToAnswer: builder.mutation({
      query: (body) => {
        console.log("body", body);
        return {
          url: `/student_question/react_to_answer`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["ReactToAnswer"],
    }),
  }),
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints\
export const {
  // useGetAllQuestionsMutation,
  useLazyGetAllQuestionsQuery,
  useGetQuestionForWeekMutation,
  useGetQuestionDetailQuery,
  useLazyGetQuestionDetailQuery,
  usePostQuestionMutation,
  useSubmitAnswerMutation,
  useLazyGetMyQuestionsQuery,
  useVoteStudentMutation,
  useReactToAnswerMutation,
} = questionsApi;
