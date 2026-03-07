import type { Component } from "solid-js";
import { A } from "@solidjs/router";

const NotFound: Component = () => {
  return (
    <div class="not-found">
      <div class="not-found-code">404</div>
      <div class="not-found-title">Page not found</div>
      <div class="not-found-text">
        The page you're looking for doesn't exist or has been moved.
      </div>
      <A href="/" class="not-found-link">
        Back to Home
      </A>
    </div>
  );
};

export default NotFound;
