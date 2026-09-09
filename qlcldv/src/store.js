import { configureStore, createSlice } from "@reduxjs/toolkit";
import { initialBlogPosts } from "./data/blogPosts.js";

const cameraSlice = createSlice({
  name: "camera",
  initialState: { file: null, tongdaFile: null, startDate: "", endDate: "", employees: "", results: [], processed: false },
  reducers: {
    setFile: (state, action) => { state.file = action.payload; state.results = []; state.processed = false; },
    setTongdaFile: (state, action) => { state.tongdaFile = action.payload; state.results = []; state.processed = false; },
    setStartDate: (state, action) => { state.startDate = action.payload; state.results = []; state.processed = false; },
    setEndDate: (state, action) => { state.endDate = action.payload; state.results = []; state.processed = false; },
    setEmployees: (state, action) => { state.employees = action.payload; },
    setResults: (state, action) => { state.results = action.payload; state.processed = true; },
    clearResults: (state) => { state.results = []; state.processed = false; },
  },
});

const gpsSlice = createSlice({
  name: "gps",
  initialState: { file: null, tongdaFile: null, startDate: "", endDate: "", employees: "", results: [], processed: false },
  reducers: {
    setGpsFile: (state, action) => { state.file = action.payload; state.results = []; state.processed = false; },
    setGpsTongdaFile: (state, action) => { state.tongdaFile = action.payload; state.results = []; state.processed = false; },
    setGpsStartDate: (state, action) => { state.startDate = action.payload; state.results = []; state.processed = false; },
    setGpsEndDate: (state, action) => { state.endDate = action.payload; state.results = []; state.processed = false; },
    setGpsEmployees: (state, action) => { state.employees = action.payload; },
    setGpsResults: (state, action) => { state.results = action.payload; state.processed = true; },
    clearGpsResults: (state) => { state.results = []; state.processed = false; },
  },
});

const speed4hSlice = createSlice({
  name: "speed4h",
  initialState: { file: null, startDate: "", endDate: "", employees: "", results: { speed: [], fourHour: [] }, processed: false },
  reducers: {
    setSpeed4hFile: (state, action) => { state.file = action.payload; state.results = { speed: [], fourHour: [] }; state.processed = false; },
    setSpeed4hStartDate: (state, action) => { state.startDate = action.payload; state.results = { speed: [], fourHour: [] }; state.processed = false; },
    setSpeed4hEndDate: (state, action) => { state.endDate = action.payload; state.results = { speed: [], fourHour: [] }; state.processed = false; },
    setSpeed4hEmployees: (state, action) => { state.employees = action.payload; },
    setSpeed4hResults: (state, action) => { state.results = action.payload; state.processed = true; },
    clearSpeed4hResults: state => { state.results = { speed: [], fourHour: [] }; state.processed = false; },
  },
});

const gsttSlice = createSlice({
  name: "gstt",
  initialState: { file: null, startDate: "", endDate: "", employees: "", results: [], processed: false },
  reducers: {
    setGsttFile: (state, action) => { state.file = action.payload; state.results = []; state.processed = false; },
    setGsttStartDate: (state, action) => { state.startDate = action.payload; state.results = []; state.processed = false; },
    setGsttEndDate: (state, action) => { state.endDate = action.payload; state.results = []; state.processed = false; },
    setGsttEmployees: (state, action) => { state.employees = action.payload; },
    setGsttResults: (state, action) => { state.results = action.payload; state.processed = true; },
    clearGsttResults: state => { state.results = []; state.processed = false; },
  },
});

const blogSlice = createSlice({
  name: "blog",
  initialState: { posts: initialBlogPosts, loading: false, source: "demo", error: "" },
  reducers: {
    addBlogPost: (state, action) => {
      if (action.payload.featured) state.posts.forEach(post => { post.featured = false; });
      state.posts.unshift(action.payload);
    },
    updateBlogPost: (state, action) => {
      const index = state.posts.findIndex(post => post.id === action.payload.id);
      if (action.payload.featured) state.posts.forEach(post => { post.featured = false; });
      if (index !== -1) state.posts[index] = action.payload;
    },
    deleteBlogPost: (state, action) => {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
    setBlogPosts: (state, action) => {
      state.posts = action.payload;
      state.source = "database";
      state.error = "";
    },
    setBlogLoading: (state, action) => { state.loading = action.payload; },
    setBlogError: (state, action) => { state.error = action.payload; },
  },
});

export const { setFile, setTongdaFile, setStartDate, setEndDate, setEmployees, setResults, clearResults } = cameraSlice.actions;
export const { setGpsFile, setGpsTongdaFile, setGpsStartDate, setGpsEndDate, setGpsEmployees, setGpsResults, clearGpsResults } = gpsSlice.actions;
export const { setSpeed4hFile, setSpeed4hStartDate, setSpeed4hEndDate, setSpeed4hEmployees, setSpeed4hResults, clearSpeed4hResults } = speed4hSlice.actions;
export const { setGsttFile, setGsttStartDate, setGsttEndDate, setGsttEmployees, setGsttResults, clearGsttResults } = gsttSlice.actions;
export const { addBlogPost, updateBlogPost, deleteBlogPost, setBlogPosts, setBlogLoading, setBlogError } = blogSlice.actions;
export const store = configureStore({
  reducer: { camera: cameraSlice.reducer, gps: gpsSlice.reducer, speed4h: speed4hSlice.reducer, gstt: gsttSlice.reducer, blog: blogSlice.reducer },
  middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
});
