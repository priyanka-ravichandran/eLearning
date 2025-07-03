// store.js
import { configureStore } from "@reduxjs/toolkit";
import { createUserApi } from "./api/createUserApi";
import { groupsApi } from "./api/groupsApi";
import { questionsApi } from "./api/questionsApi";
import { studentsApi } from "./api/studentsApi";
import { avatarApi } from "./api/avatarApi";
import userSlice from "./userSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, userSlice);

const store = configureStore({
  reducer: {
    [createUserApi.reducerPath]: createUserApi.reducer,
    [groupsApi.reducerPath]: groupsApi.reducer,
    [studentsApi.reducerPath]: studentsApi.reducer,
    [questionsApi.reducerPath]: questionsApi.reducer,
    [avatarApi.reducerPath]: avatarApi.reducer,
    user: persistedReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,   // optional: silence redux-persist warnings
    }).concat(
      createUserApi.middleware,
      groupsApi.middleware,
      studentsApi.middleware,
      questionsApi.middleware,
      avatarApi.middleware
      // logger   ←- add here only once if you need it
    ),
});

export const persistor = persistStore(store);
export default store;
