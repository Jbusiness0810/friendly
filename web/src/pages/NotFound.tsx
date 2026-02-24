import type { Component } from "solid-js";
import { A } from "@solidjs/router";

const NotFound: Component = () => {
  return (
    <div class="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 px-8">
      <p class="text-5xl mb-3">🗺️</p>
      <h1 class="text-xl font-bold text-gray-700 mb-1">Page not found</h1>
      <p class="text-sm text-center mb-4">
        This corner of the neighborhood doesn't exist yet.
      </p>
      <A href="/" class="text-sm text-green-600 hover:text-green-700 font-medium">
        Go Home
      </A>
    </div>
  );
};

export default NotFound;
