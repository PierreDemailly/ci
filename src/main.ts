import * as vuln from "@nodesecure/vuln";
import * as scanner from "@nodesecure/scanner";
import type { Scanner } from "@nodesecure/scanner";

import {
  DEFAULT_RUNTIME_CONFIGURATION,
  RuntimeConfiguration
} from "./nodesecurerc.js";
import { reportScannerLoggerEvents } from "./reporters/index.js";
import * as pipeline from "./pipeline.js";

async function runScannerAnalysis(
  runtimeConfig: RuntimeConfiguration
): Promise<Scanner.Payload> {
  const { strategy } = await vuln.setStrategy(
    vuln.strategies[runtimeConfig.strategy]
  );
  const logger = new scanner.Logger();

  reportScannerLoggerEvents(logger);

  const payload = await scanner.cwd(
    runtimeConfig.rootDir,
    {
      vulnerabilityStrategy: strategy
    },
    logger
  );

  return payload;
}

export async function runPipeline(): Promise<void> {
  /**
   * For now, the runtime configuration comes from a in-memory constant.
   * In the future, this configuration will come from a .nodesecurerc parsed
   * at runtime.
   */
  try {
    const runtimeConfig = DEFAULT_RUNTIME_CONFIGURATION;
    const analysisPayload = await runScannerAnalysis(runtimeConfig);
    /**
     * Once the payload generated by the scanner analysis is available, we can
     * now run the interpreter and use the config to determine whether the
     * pipeline should fail or be successful.
     */
    await pipeline.runChecks(analysisPayload, runtimeConfig);
  } catch {
    process.exit(1);
  }
}
