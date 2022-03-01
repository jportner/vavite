/// <reference types="@vavite/multibuild-cli" />

import { Plugin } from "vite";
import vaviteConnect from "@vavite/connect";
import vaviteReloader from "@vavite/reloader";
import vaviteExposeViteDevServer from "@vavite/expose-vite-dev-server";

export interface VaviteOptions {
	/** Entry module that default exports a middleware function.
	 * You have to provide either a handler entry or a server entry.
	 * If you provide both, the server entry will only be used in the
	 * production build.
	 */
	handlerEntry?: string;
	/** Server entry point. You have to provide either a handler entry
	 * or a server entry. If you provide both, the server entry will only
	 * be used in the production build.
	 */
	serverEntry?: string;
	/** Whether to serve client-side assets in development.
	 * @default false
	 */
	serveClientAssetsInDev?: boolean;
	/** If you only provide a handler entry, this option controls whether
	 * to build a standalone server application or a middleware function.
	 * @default true
	 */
	standalone?: boolean;
	/** Directory where the client-side assets are located. Set to null to disable
	 * static file serving in production.
	 * @default null
	 */
	clientAssetsDir?: string | null;
	/** Whether to bundle the sirv package or to import it when building in standalone
	 * mode. You have to install it as a production dependency if this is set to false.
	 * @default true
	 */
	bundleSirv?: boolean;
	/**
	 * When to reload the server. "any-change" reloads every time any of the dependencies of the
	 * server entry changes. "static-deps-change" only reloads when statically imported dependencies
	 * change, dynamically imported dependencies are not tracked.
	 * @default "any-change"
	 */
	reloadOn?: "any-change" | "static-deps-change";
}

export default function vavite(options: VaviteOptions): Plugin[] {
	const {
		serverEntry,
		handlerEntry,
		serveClientAssetsInDev,
		standalone,
		clientAssetsDir,
		bundleSirv,
		reloadOn,
	} = options;

	if (!serverEntry && !handlerEntry) {
		throw new Error(
			"vavite: either serverEntry or handlerEntry must be specified",
		);
	}

	let buildStepStartCalled = false;

	const plugins: Plugin[] = [
		{
			name: "vavite:check-multibuild",

			buildStepStart() {
				buildStepStartCalled = true;
			},

			configResolved(config) {
				if (
					config.buildSteps &&
					config.command === "build" &&
					config.mode !== "multibuild" &&
					!buildStepStartCalled
				) {
					throw new Error(
						"vavite: You have buildSteps in your config but you're not using vavite CLI or @vavite/multibuild.",
					);
				}
			},
		},
	];

	if (handlerEntry) {
		plugins.push(
			...vaviteConnect({
				handlerEntry,
				customServerEntry: serverEntry,
				serveClientAssetsInDev,
				standalone,
				clientAssetsDir,
				bundleSirv,
			}),
		);
	} else {
		plugins.push(
			vaviteReloader({
				entry: serverEntry,
				serveClientAssetsInDev,
				reloadOn,
			}),
		);
	}

	plugins.push(vaviteExposeViteDevServer());

	return plugins;
}
