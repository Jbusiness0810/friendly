/* @refresh reload */
import { render } from "solid-js/web";
import { Router, useRoutes } from "@solidjs/router";
import App from "./App";
import routes from "./routes";
import "./index.css";

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error("Root element not found. Did you forget to add it to your index.html?");
}

const Routes = useRoutes(routes);

render(
  () => (
    <Router root={App}>
      <Routes />
    </Router>
  ),
  root!
);
