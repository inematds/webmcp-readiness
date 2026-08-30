#!/usr/bin/env node

import process from 'node:process'
import { chromium } from 'playwright-core'

const targetUrl = process.argv[2] ?? 'https://www.inema.club/'
const executablePath = process.env.CHROME_PATH

if (!executablePath) {
  console.error(JSON.stringify({
    ok: false,
    error: 'CHROME_PATH não definido',
    hint: 'Defina CHROME_PATH com o caminho de google-chrome, chromium ou chromium-browser.',
  }, null, 2))
  process.exit(2)
}

async function runProbe(name, extraArgs = []) {
  const args = [...extraArgs]

  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    args.push('--no-sandbox')
  }

  let browser

  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args,
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 45_000,
    })

    const result = await page.evaluate(async () => {
      const declarativeTools = [...document.querySelectorAll('form[toolname]')]
        .map((form) => ({
          name: form.getAttribute('toolname'),
          description: form.getAttribute('tooldescription'),
        }))

      const modelContext = document.modelContext
      let runtimeTools = []
      let runtimeError = null

      if (modelContext && typeof modelContext.getTools === 'function') {
        try {
          const tools = await modelContext.getTools()
          runtimeTools = tools.map((tool) => ({
            name: tool.name ?? null,
            description: tool.description ?? null,
          }))
        } catch (error) {
          runtimeError = error instanceof Error ? error.message : String(error)
        }
      }

      return {
        page: {
          url: location.href,
          secureContext: isSecureContext,
          originAgentCluster: window.originAgentCluster ?? null,
        },
        declarative: {
          count: declarativeTools.length,
          tools: declarativeTools,
        },
        runtime: {
          modelContext: Boolean(modelContext),
          getTools: typeof modelContext?.getTools === 'function',
          tools: runtimeTools,
          error: runtimeError,
        },
      }
    })

    return {
      name,
      browser: {
        launched: true,
        version: browser.version(),
        executablePath,
        args,
      },
      ...result,
    }
  } catch (error) {
    return {
      name,
      browser: {
        launched: false,
        executablePath,
        args,
      },
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    await browser?.close()
  }
}

const normal = await runProbe('normal')
const experimental = await runProbe('experimental', ['--enable-features=WebMCP'])

const report = {
  checkedAt: new Date().toISOString(),
  targetUrl,
  infraOk: normal.browser.launched && experimental.browser.launched,
  normal,
  experimental,
}

console.log(JSON.stringify(report, null, 2))

if (!report.infraOk) {
  process.exitCode = 1
}
