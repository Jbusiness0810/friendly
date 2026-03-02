/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import App from "./App";
import Home from "./pages/Home";
import Circles from "./pages/Circles";
import Events from "./pages/Events";
import Matches from "./pages/Matches";
import Profile from "./pages/Profile";
import "./index.css";

render(
  () => (
    <Router root={App}>
      <Route path="/" component={Home} />
      <Route path="/circles" component={Circles} />
      <Route path="/events" component={Events} />
      <Route path="/matches" component={Matches} />
      <Route path="/profile" component={Profile} />
    </Router>
  ),
  document.getElementById("root")!
);
