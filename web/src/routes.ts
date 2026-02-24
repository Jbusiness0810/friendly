import { lazy } from "solid-js";
import type { RouteDefinition } from "@solidjs/router";

const routes: RouteDefinition[] = [
  { path: "/", component: lazy(() => import("./pages/Home")) },
  { path: "/circles", component: lazy(() => import("./pages/Circles")) },
  { path: "/events", component: lazy(() => import("./pages/Events")) },
  { path: "/matches", component: lazy(() => import("./pages/Matches")) },
  { path: "/profile", component: lazy(() => import("./pages/Profile")) },
  { path: "**", component: lazy(() => import("./pages/NotFound")) },
];

export default routes;
