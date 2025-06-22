// store.js

import { configureStore } from "@reduxjs/toolkit";
import { createUserApi } from "./api/createUserApi";
import userSlice from "./userSlice";
import { groupsApi } from "./api/groupsApi";
import { questionsApi } from "./api/questionsApi";
import { studentsApi } from "./api/studentsApi";
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

//CustomMiddleware

const persistConfig = {
  key: 'root',
  storage,
};

const persistedReducer = persistReducer(persistConfig, userSlice);


const store = configureStore({
  reducer: {
    [createUserApi.reducerPath]: createUserApi.reducer,
    [groupsApi.reducerPath]: groupsApi.reducer,
    [studentsApi.reducerPath]: studentsApi.reducer,
    [questionsApi.reducerPath]: questionsApi.reducer,
    user: persistedReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(
      ...getDefaultMiddleware(),
      createUserApi.middleware,
      groupsApi.middleware,
      studentsApi.middleware,
      questionsApi.middleware
      // logger
    );
  },
});
export const  persistor = persistStore(store);


export default store;
