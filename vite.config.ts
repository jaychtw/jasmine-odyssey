import { defineConfig } from "vite";

// GitHub project sites live under a repository path. Local development stays at /.
export default defineConfig({
  base: process.env.BASE_PATH || "/",
});
